from typing import Dict
from pydantic import BaseModel, Field


class DashboardSummaryResponse(BaseModel):
    total_findings: int = Field(0, description="Total number of recorded findings")
    severity_breakdown: Dict[str, int] = Field(default_factory=dict, description="Count of findings by severity")
    average_risk_score: float = Field(0.0, description="Average calculated risk score across all findings")
    total_tasks: int = Field(0, description="Total remediation tasks created")
    task_status_breakdown: Dict[str, int] = Field(default_factory=dict, description="Count of tasks by status")
    total_verifications: int = Field(0, description="Total verification evidence entries recorded")
    verification_breakdown: Dict[str, int] = Field(default_factory=dict, description="Count of verifications by result")
    verified_fixed_findings: int = Field(0, description="Number of distinct findings verified as fixed")
    open_findings: int = Field(0, description="Number of findings not yet verified as fixed")
