from enum import Enum
from typing import Iterable, Optional


class SeverityLevel(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    INFORMATIONAL = "Informational"

    @classmethod
    def normalize(cls, value: str) -> "SeverityLevel":
        if not value or not isinstance(value, str):
            raise ValueError("Severity must be a non-empty string.")
        cleaned = value.strip().upper()
        mapping = {
            "CRITICAL": cls.CRITICAL,
            "HIGH": cls.HIGH,
            "MEDIUM": cls.MEDIUM,
            "MODERATE": cls.MEDIUM,
            "LOW": cls.LOW,
            "INFORMATIONAL": cls.INFORMATIONAL,
            "INFO": cls.INFORMATIONAL,
        }
        if cleaned in mapping:
            return mapping[cleaned]
        raise ValueError(
            f"Invalid severity '{value}'. Allowed: Critical, High, Medium, Low, Informational."
        )


class TaskStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    BLOCKED = "Blocked"
    COMPLETED = "Completed"

    @classmethod
    def normalize(cls, value: str) -> "TaskStatus":
        if not value or not isinstance(value, str):
            raise ValueError("Status must be a non-empty string.")
        cleaned = value.strip().lower()
        mapping = {
            "open": cls.OPEN,
            "in progress": cls.IN_PROGRESS,
            "in_progress": cls.IN_PROGRESS,
            "inprogress": cls.IN_PROGRESS,
            "blocked": cls.BLOCKED,
            "completed": cls.COMPLETED,
            "done": cls.COMPLETED,
            "closed": cls.COMPLETED,
        }
        if cleaned in mapping:
            return mapping[cleaned]
        raise ValueError(
            f"Invalid status '{value}'. Allowed: Open, In Progress, Blocked, Completed."
        )


class VerificationResult(str, Enum):
    VERIFIED_FIXED = "Verified Fixed"
    FAILED = "Failed"
    PARTIALLY_FIXED = "Partially Fixed"
    INCONCLUSIVE = "Inconclusive"

    @classmethod
    def normalize(cls, value: object) -> "VerificationResult":
        if not isinstance(value, str) or not value.strip():
            raise ValueError("Verification result must be a non-empty string.")
        cleaned = value.strip().lower()
        mapping = {
            "verified fixed": cls.VERIFIED_FIXED,
            "verified_fixed": cls.VERIFIED_FIXED,
            "verified": cls.VERIFIED_FIXED,
            "fixed": cls.VERIFIED_FIXED,
            "passed": cls.VERIFIED_FIXED,
            "failed": cls.FAILED,
            "fail": cls.FAILED,
            "partially fixed": cls.PARTIALLY_FIXED,
            "partially_fixed": cls.PARTIALLY_FIXED,
            "partial": cls.PARTIALLY_FIXED,
            "inconclusive": cls.INCONCLUSIVE,
        }
        if cleaned in mapping:
            return mapping[cleaned]
        raise ValueError(
            "Invalid verification result. Allowed: Verified Fixed, Failed, "
            "Partially Fixed, Inconclusive."
        )


def latest_valid_verification_result(
    evidence: Iterable[tuple[int, str]],
) -> Optional[VerificationResult]:
    """Return the result attached to the highest-ID valid evidence record."""
    latest: Optional[tuple[int, VerificationResult]] = None
    for evidence_id, result in evidence:
        try:
            normalized = VerificationResult(result)
        except ValueError:
            # Ignore non-canonical legacy data; new API input is normalized by
            # VerificationResult.normalize before it can be persisted.
            continue
        if latest is None or evidence_id > latest[0]:
            latest = (evidence_id, normalized)
    return latest[1] if latest is not None else None
