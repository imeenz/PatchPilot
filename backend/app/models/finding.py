from datetime import datetime, timezone
from typing import List, Optional, Any
from sqlalchemy import Integer, String, Text, Float, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    cve_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    package_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    installed_version: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    fixed_version: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    source: Mapped[str] = mapped_column(String(100), nullable=False, default="json_import", index=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    original_data: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    tasks: Mapped[List["RemediationTask"]] = relationship(
        "RemediationTask",
        back_populates="finding",
        cascade="all, delete-orphan",
        order_by="RemediationTask.id.desc()",
    )
    verifications: Mapped[List["VerificationEvidence"]] = relationship(
        "VerificationEvidence",
        back_populates="finding",
        cascade="all, delete-orphan",
        order_by="VerificationEvidence.id.desc()",
    )
