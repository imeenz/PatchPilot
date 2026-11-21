from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.finding import Finding
    from app.models.verification import VerificationEvidence


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RemediationTask(Base):
    __tablename__ = "remediation_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    finding_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assignee: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Open", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    # Relationships
    finding: Mapped["Finding"] = relationship("Finding", back_populates="tasks")
    verifications: Mapped[List["VerificationEvidence"]] = relationship(
        "VerificationEvidence",
        back_populates="task",
        order_by="VerificationEvidence.id.desc()",
    )
