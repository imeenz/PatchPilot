from typing import List, Optional, Tuple, Any, Dict
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, selectinload

from app.models.finding import Finding
from app.models.task import RemediationTask
from app.models.verification import VerificationEvidence
from app.schemas.common import SeverityLevel, VerificationResult
from app.schemas.finding import (
    FindingResponse,
    FindingDetailResponse,
    FindingListResponse,
    FindingImportResponse,
    FindingImportRejectedItem,
)
from app.services.risk_scoring import RiskScoringService


class FindingService:

    @classmethod
    def import_findings(
        cls,
        db: Session,
        raw_payload: Any,
    ) -> FindingImportResponse:
        """
        Imports findings from either:
        - A JSON list: [ {...}, {...} ]
        - A JSON object with a 'findings' list: { "findings": [ {...}, ... ] }

        Validates required fields and severity. Rejects invalid records safely.
        Ensures atomic persistence for valid records without creating partial/corrupt records.
        """
        raw_items: List[Any] = []

        if isinstance(raw_payload, list):
            raw_items = raw_payload
        elif isinstance(raw_payload, dict):
            if "findings" in raw_payload and isinstance(raw_payload["findings"], list):
                raw_items = raw_payload["findings"]
            else:
                # If it's a single dictionary finding, treat as a 1-item list
                raw_items = [raw_payload]
        else:
            raise ValueError("Payload must be a JSON array or an object containing a 'findings' array.")

        total_records = len(raw_items)
        imported_findings_models: List[Finding] = []
        rejected_items: List[FindingImportRejectedItem] = []

        for idx, item in enumerate(raw_items):
            if not isinstance(item, dict):
                rejected_items.append(
                    FindingImportRejectedItem(
                        index=idx,
                        raw_data=item,
                        reason="Item is not a valid JSON object.",
                    )
                )
                continue

            # Validate required fields
            title = item.get("title")
            description = item.get("description")
            severity_raw = item.get("severity")
            source = item.get("source") or "json_import"

            missing = []
            if not title or not str(title).strip():
                missing.append("title")
            if not description or not str(description).strip():
                missing.append("description")
            if not severity_raw or not str(severity_raw).strip():
                missing.append("severity")

            if missing:
                rejected_items.append(
                    FindingImportRejectedItem(
                        index=idx,
                        raw_data=item,
                        reason=f"Missing or empty required field(s): {', '.join(missing)}.",
                    )
                )
                continue

            # Validate severity value
            try:
                normalized_severity = SeverityLevel.normalize(str(severity_raw)).value
            except ValueError as e:
                rejected_items.append(
                    FindingImportRejectedItem(
                        index=idx,
                        raw_data=item,
                        reason=str(e),
                    )
                )
                continue

            # Handle optional fields and aliases
            cve_id = item.get("cve_id") or item.get("cve")
            if cve_id is not None:
                cve_id = str(cve_id).strip() or None

            package_name = item.get("package_name") or item.get("package")
            if package_name is not None:
                package_name = str(package_name).strip() or None

            installed_version = item.get("installed_version") or item.get("version")
            if installed_version is not None:
                installed_version = str(installed_version).strip() or None

            fixed_version = item.get("fixed_version")
            if fixed_version is not None:
                fixed_version = str(fixed_version).strip() or None

            file_path = item.get("file_path") or item.get("path") or item.get("file")
            if file_path is not None:
                file_path = str(file_path).strip() or None

            # Calculate deterministic risk score
            has_cve = bool(cve_id)
            has_fix = bool(fixed_version)
            risk_score, _ = RiskScoringService.calculate_score(
                severity_str=normalized_severity,
                has_cve=has_cve,
                has_fix=has_fix,
            )

            finding = Finding(
                title=str(title).strip(),
                description=str(description).strip(),
                severity=normalized_severity,
                cve_id=cve_id,
                package_name=package_name,
                installed_version=installed_version,
                fixed_version=fixed_version,
                source=str(source).strip(),
                file_path=file_path,
                risk_score=risk_score,
                original_data=item,
            )
            imported_findings_models.append(finding)

        # Atomic commit of all valid findings
        if imported_findings_models:
            try:
                db.add_all(imported_findings_models)
                db.commit()
                for f in imported_findings_models:
                    db.refresh(f)
            except Exception as e:
                db.rollback()
                raise RuntimeError(f"Database error during findings import: {e}")

        imported_responses = [
            FindingResponse(
                id=f.id,
                title=f.title,
                description=f.description,
                severity=f.severity,
                cve_id=f.cve_id,
                package_name=f.package_name,
                installed_version=f.installed_version,
                fixed_version=f.fixed_version,
                source=f.source,
                file_path=f.file_path,
                risk_score=f.risk_score,
                created_at=f.created_at,
                tasks_count=0,
                is_verified_fixed=False,
            )
            for f in imported_findings_models
        ]

        return FindingImportResponse(
            total_records=total_records,
            imported_count=len(imported_findings_models),
            rejected_count=len(rejected_items),
            imported_findings=imported_responses,
            rejected_findings=rejected_items,
        )

    @classmethod
    def list_findings(
        cls,
        db: Session,
        page: int = 1,
        size: int = 20,
        severity: Optional[str] = None,
        source: Optional[str] = None,
        has_cve: Optional[bool] = None,
        query: Optional[str] = None,
    ) -> FindingListResponse:
        page = max(1, page)
        size = min(100, max(1, size))

        stmt = select(Finding)

        if severity:
            norm_sev = SeverityLevel.normalize(severity).value
            stmt = stmt.where(Finding.severity == norm_sev)

        if source:
            stmt = stmt.where(Finding.source.ilike(f"%{source.strip()}%"))

        if has_cve is True:
            stmt = stmt.where(Finding.cve_id.isnot(None), Finding.cve_id != "")
        elif has_cve is False:
            stmt = stmt.where(or_(Finding.cve_id.is_(None), Finding.cve_id == ""))

        if query and query.strip():
            q = f"%{query.strip()}%"
            stmt = stmt.where(
                or_(
                    Finding.title.ilike(q),
                    Finding.description.ilike(q),
                    Finding.package_name.ilike(q),
                    Finding.cve_id.ilike(q),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.scalar(count_stmt) or 0

        # Order by risk score descending, then ID descending
        stmt = (
            stmt.options(selectinload(Finding.tasks), selectinload(Finding.verifications))
            .order_by(Finding.risk_score.desc(), Finding.id.desc())
            .offset((page - 1) * size)
            .limit(size)
        )

        findings = db.scalars(stmt).all()

        items: List[FindingResponse] = []
        for f in findings:
            is_fixed = any(
                v.verification_result == VerificationResult.VERIFIED_FIXED.value
                for v in f.verifications
            )
            items.append(
                FindingResponse(
                    id=f.id,
                    title=f.title,
                    description=f.description,
                    severity=f.severity,
                    cve_id=f.cve_id,
                    package_name=f.package_name,
                    installed_version=f.installed_version,
                    fixed_version=f.fixed_version,
                    source=f.source,
                    file_path=f.file_path,
                    risk_score=f.risk_score,
                    created_at=f.created_at,
                    tasks_count=len(f.tasks),
                    is_verified_fixed=is_fixed,
                )
            )

        total_pages = (total + size - 1) // size if total > 0 else 1

        return FindingListResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            total_pages=total_pages,
        )

    @classmethod
    def get_finding(cls, db: Session, finding_id: int) -> Optional[Finding]:
        stmt = (
            select(Finding)
            .where(Finding.id == finding_id)
            .options(selectinload(Finding.tasks), selectinload(Finding.verifications))
        )
        return db.scalar(stmt)
