from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.common import SeverityLevel
from app.schemas.task import TaskResponse
from app.schemas.verification import VerificationResponse


class FindingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Title of the vulnerability finding")
    description: str = Field(..., min_length=1, description="Detailed explanation of the vulnerability")
    severity: str = Field(..., description="Critical, High, Medium, Low, Informational")
    cve_id: Optional[str] = Field(None, max_length=50, description="CVE identifier (e.g., CVE-2023-12345)")
    package_name: Optional[str] = Field(None, max_length=255, description="Vulnerable package/dependency name")
    installed_version: Optional[str] = Field(None, max_length=100, description="Currently installed version")
    fixed_version: Optional[str] = Field(None, max_length=100, description="Version where vulnerability is fixed")
    source: str = Field("json_import", max_length=100, description="Origin of the finding (scanner, manual, etc.)")
    file_path: Optional[str] = Field(None, max_length=1000, description="File path or location of vulnerability")

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: str) -> str:
        return SeverityLevel.normalize(v).value


class FindingCreate(FindingBase):
    original_data: Optional[Any] = None


class FindingResponse(FindingBase):
    id: int
    risk_score: float
    created_at: datetime
    tasks_count: Optional[int] = 0
    is_verified_fixed: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class FindingDetailResponse(FindingResponse):
    original_data: Optional[Any] = None
    tasks: List[TaskResponse] = []
    verifications: List[VerificationResponse] = []

    model_config = ConfigDict(from_attributes=True)


class FindingListResponse(BaseModel):
    items: List[FindingResponse]
    total: int
    page: int
    size: int
    total_pages: int


class FindingImportRejectedItem(BaseModel):
    index: int
    raw_data: Any
    reason: str


class FindingImportResponse(BaseModel):
    total_records: int
    imported_count: int
    rejected_count: int
    imported_findings: List[FindingResponse]
    rejected_findings: List[FindingImportRejectedItem]
