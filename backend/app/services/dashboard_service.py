from typing import Dict
from sqlalchemy import select, func, distinct
from sqlalchemy.orm import Session

from app.models.finding import Finding
from app.models.task import RemediationTask
from app.models.verification import VerificationEvidence
from app.schemas.common import SeverityLevel, TaskStatus, VerificationResult
from app.schemas.dashboard import DashboardSummaryResponse


class DashboardService:

    @classmethod
    def get_summary(cls, db: Session) -> DashboardSummaryResponse:
        # Total findings
        total_findings = db.scalar(select(func.count(Finding.id))) or 0

        # Severity breakdown
        severity_counts = dict(
            db.execute(
                select(Finding.severity, func.count(Finding.id)).group_by(Finding.severity)
            ).all()
        )
        # Ensure all standard severities are present in dict
        severity_breakdown = {
            s.value: severity_counts.get(s.value, 0) for s in SeverityLevel
        }

        # Average risk score
        avg_risk = db.scalar(select(func.avg(Finding.risk_score)))
        average_risk_score = round(float(avg_risk), 1) if avg_risk is not None else 0.0

        # Total tasks and task status breakdown
        total_tasks = db.scalar(select(func.count(RemediationTask.id))) or 0
        task_counts = dict(
            db.execute(
                select(RemediationTask.status, func.count(RemediationTask.id)).group_by(
                    RemediationTask.status
                )
            ).all()
        )
        task_status_breakdown = {
            s.value: task_counts.get(s.value, 0) for s in TaskStatus
        }

        # Verification metrics
        total_verifications = db.scalar(select(func.count(VerificationEvidence.id))) or 0
        verif_counts = dict(
            db.execute(
                select(
                    VerificationEvidence.verification_result,
                    func.count(VerificationEvidence.id),
                ).group_by(VerificationEvidence.verification_result)
            ).all()
        )
        verification_breakdown = {
            v.value: verif_counts.get(v.value, 0) for v in VerificationResult
        }

        # Verified fixed findings count (distinct finding_ids with Verified Fixed)
        verified_fixed_stmt = select(
            func.count(distinct(VerificationEvidence.finding_id))
        ).where(
            VerificationEvidence.verification_result == VerificationResult.VERIFIED_FIXED.value
        )
        verified_fixed_findings = db.scalar(verified_fixed_stmt) or 0
        open_findings = max(0, total_findings - verified_fixed_findings)

        return DashboardSummaryResponse(
            total_findings=total_findings,
            severity_breakdown=severity_breakdown,
            average_risk_score=average_risk_score,
            total_tasks=total_tasks,
            task_status_breakdown=task_status_breakdown,
            total_verifications=total_verifications,
            verification_breakdown=verification_breakdown,
            verified_fixed_findings=verified_fixed_findings,
            open_findings=open_findings,
        )
