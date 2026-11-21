from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.common import TaskStatus


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Short title describing the remediation task")
    description: Optional[str] = Field(None, description="Detailed instructions or context for the task")
    assignee: Optional[str] = Field(None, max_length=100, description="Person or team member responsible")
    status: str = Field(default=TaskStatus.OPEN.value, description="Task status: Open, In Progress, Blocked, Completed")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        return TaskStatus.normalize(v).value


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    assignee: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return TaskStatus.normalize(v).value


class TaskResponse(TaskBase):
    id: int
    finding_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
