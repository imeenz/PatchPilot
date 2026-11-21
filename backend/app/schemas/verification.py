from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.common import VerificationResult


class VerificationBase(BaseModel):
    task_id: Optional[int] = Field(None, description="Optional associated task ID")
    evidence_description: str = Field(
        ..., min_length=1, description="Description of the manual test or tool output confirming fix"
    )
    evidence_url: Optional[str] = Field(None, max_length=1000, description="Optional link to PR, commit, or scan report")
    verification_result: str = Field(
        default=VerificationResult.VERIFIED_FIXED.value,
        description="Result of verification: Verified Fixed, Failed, Partially Fixed, Inconclusive",
    )

    @field_validator("verification_result")
    @classmethod
    def validate_result(cls, v: str) -> str:
        return VerificationResult.normalize(v).value


class VerificationCreate(VerificationBase):
    pass


class VerificationResponse(VerificationBase):
    id: int
    finding_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
