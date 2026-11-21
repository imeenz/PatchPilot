from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.finding import Finding
from app.models.task import RemediationTask
from app.models.verification import VerificationEvidence
from app.schemas.verification import VerificationCreate


class VerificationService:

    @classmethod
    def create_verification(
        cls,
        db: Session,
        finding_id: int,
        verification_in: VerificationCreate,
    ) -> VerificationEvidence:
        # Validate finding exists
        finding = db.get(Finding, finding_id)
        if not finding:
            raise KeyError(f"Finding with ID {finding_id} not found.")

        # Validate task if provided
        if verification_in.task_id is not None:
            task = db.get(RemediationTask, verification_in.task_id)
            if not task:
                raise KeyError(f"Task with ID {verification_in.task_id} not found.")
            if task.finding_id != finding_id:
                raise ValueError(
                    f"Task {verification_in.task_id} does not belong to Finding {finding_id}."
                )

        evidence = VerificationEvidence(
            finding_id=finding_id,
            task_id=verification_in.task_id,
            evidence_description=verification_in.evidence_description.strip(),
            evidence_url=verification_in.evidence_url.strip() if verification_in.evidence_url else None,
            verification_result=verification_in.verification_result,
        )
        db.add(evidence)
        db.commit()
        db.refresh(evidence)
        return evidence

    @classmethod
    def list_verifications_for_finding(
        cls,
        db: Session,
        finding_id: int,
    ) -> List[VerificationEvidence]:
        # Validate finding exists
        finding = db.get(Finding, finding_id)
        if not finding:
            raise KeyError(f"Finding with ID {finding_id} not found.")

        stmt = (
            select(VerificationEvidence)
            .where(VerificationEvidence.finding_id == finding_id)
            .order_by(VerificationEvidence.id.desc())
        )
        return list(db.scalars(stmt).all())
