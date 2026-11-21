from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.finding import Finding
    from app.models.task import RemediationTask


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class VerificationEvidence(Base):
    __tablename__ = "verification_evidence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    finding_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    task_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("remediation_tasks.id", ondelete="SET NULL"), nullable=True, index=True
    )
    evidence_description: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    verification_result: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Verified Fixed", index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    finding: Mapped["Finding"] = relationship("Finding", back_populates="verifications")
    task: Mapped[Optional["RemediationTask"]] = relationship("RemediationTask", back_populates="verifications")
