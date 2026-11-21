from typing import Tuple
from app.schemas.common import SeverityLevel

SEVERITY_BASE_SCORES = {
    SeverityLevel.CRITICAL: 95.0,
    SeverityLevel.HIGH: 75.0,
    SeverityLevel.MEDIUM: 50.0,
    SeverityLevel.LOW: 25.0,
    SeverityLevel.INFORMATIONAL: 5.0,
}


class RiskScoringService:
    """
    Deterministic and explainable risk-scoring service.

    IMPORTANT DISCLAIMER:
    This score is a severity-based prioritization score intended for triage
    and student/beginner developer workflow prioritization. It is NOT an official
    CVSS vector score and does NOT represent verified live exploitability assessment.
    """

    @classmethod
    def calculate_score(
        cls,
        severity_str: str,
        has_cve: bool = False,
        has_fix: bool = False,
    ) -> Tuple[float, str]:
        severity = SeverityLevel.normalize(severity_str)
        base_score = SEVERITY_BASE_SCORES.get(severity, 50.0)

        # Explainable factors
        adjustments = []
        final_score = base_score

        if has_cve:
            adjustments.append("known public CVE registered (+2)")
            final_score += 2.0

        if has_fix:
            adjustments.append("fixed version already available (+1 triage priority)")
            final_score += 1.0

        final_score = min(100.0, max(0.0, round(final_score, 1)))

        adj_text = f" Adjustments applied: {', '.join(adjustments)}." if adjustments else " No secondary adjustments applied."
        explanation = (
            f"Base score of {base_score} derived from '{severity.value}' severity.{adj_text} "
            f"Final prioritization score: {final_score}/100. "
            "(Note: This is a severity-based prioritization score, not a verified exploitability assessment or an official CVSS score.)"
        )

        return final_score, explanation
