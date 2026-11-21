import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.remediation import RemediationGuidanceResponse


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User message (1 to 4000 characters)",
    )
    conversation_id: Optional[str] = Field(
        None,
        description="Optional existing conversation UUID to continue a conversation",
    )
    finding_id: Optional[int] = Field(
        None,
        description="Optional finding ID to associate the conversation with",
    )

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Message cannot be empty or whitespace only.")
        stripped = v.strip()
        if len(stripped) > 4000:
            raise ValueError("Message exceeds maximum length of 4000 characters.")
        return stripped

    @field_validator("conversation_id")
    @classmethod
    def validate_conversation_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            return None
        try:
            val = uuid.UUID(cleaned)
            return str(val)
        except ValueError:
            raise ValueError(f"Invalid conversation_id '{v}'. Must be a valid UUID.")


class FindingContextSummary(BaseModel):
    id: int
    title: str
    severity: str
    risk_score: float
    cve_id: Optional[str] = None
    package_name: Optional[str] = None
    installed_version: Optional[str] = None
    fixed_version: Optional[str] = None
    file_path: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ChatMessageResponse(BaseModel):
    message_id: str
    role: str
    content: str
    is_fallback: bool = False
    provider: Optional[str] = None
    model: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    role: str = "assistant"
    content: str
    structured_guidance: Optional[RemediationGuidanceResponse] = None
    is_fallback: bool
    provider: str
    model: Optional[str] = None
    finding_context: Optional[FindingContextSummary] = None
    disclaimer: str = (
        "AI and rule-based guidance requires human review. "
        "PatchPilot does not automatically modify source code or systems."
    )
    created_at: datetime


class ConversationDetailResponse(BaseModel):
    conversation_id: str
    finding_id: Optional[int] = None
    finding_context: Optional[FindingContextSummary] = None
    title: Optional[str] = None
    messages: List[ChatMessageResponse] = []
    created_at: datetime
    updated_at: datetime
