import logging
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.finding import (
    FindingResponse,
    FindingDetailResponse,
    FindingListResponse,
    FindingImportResponse,
)
from app.schemas.task import TaskCreate, TaskResponse
from app.schemas.verification import VerificationCreate, VerificationResponse
from app.schemas.common import VerificationResult, latest_valid_verification_result
from app.schemas.remediation import RemediationGuidanceResponse
from app.services.finding_service import FindingService
from app.services.task_service import TaskService
from app.services.verification_service import VerificationService
from app.services.ai_service import AIRemediationService

router = APIRouter(prefix="/findings", tags=["Findings"])
logger = logging.getLogger(__name__)


@router.post(
    "/import",
    response_model=FindingImportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Import security findings from JSON array or object containing 'findings' list",
)
def import_findings(
    payload: Any = Body(
        ...,
        description="JSON array of finding objects, or JSON object with a 'findings' list",
    ),
    db: Session = Depends(get_db),
):
    try:
        return FindingService.import_findings(db=db, raw_payload=payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        # Exception text can contain database details or imported report data.
        # Keep a useful failure category in logs without recording that content.
        logger.error("Unexpected findings import failure (%s).", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while importing findings.",
        )


@router.get(
    "",
    response_model=FindingListResponse,
    summary="List findings with filtering and pagination",
)
def list_findings(
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    severity: Optional[str] = Query(None, description="Filter by severity (Critical, High, Medium, Low, Informational)"),
    source: Optional[str] = Query(None, description="Filter by finding source name"),
    has_cve: Optional[bool] = Query(None, description="Filter by whether a CVE is registered"),
    query: Optional[str] = Query(None, description="Search term for title, description, package, or CVE"),
    db: Session = Depends(get_db),
):
    try:
        return FindingService.list_findings(
            db=db,
            page=page,
            size=size,
            severity=severity,
            source=source,
            has_cve=has_cve,
            query=query,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{id}",
    response_model=FindingDetailResponse,
    summary="Get single finding details including associated tasks and verifications",
)
def get_finding(id: int, db: Session = Depends(get_db)):
    finding = FindingService.get_finding(db=db, finding_id=id)
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Finding with ID {id} not found.")

    latest_result = latest_valid_verification_result(
        (v.id, v.verification_result) for v in finding.verifications
    )
    is_fixed = latest_result == VerificationResult.VERIFIED_FIXED

    return FindingDetailResponse(
        id=finding.id,
        title=finding.title,
        description=finding.description,
        severity=finding.severity,
        cve_id=finding.cve_id,
        package_name=finding.package_name,
        installed_version=finding.installed_version,
        fixed_version=finding.fixed_version,
        source=finding.source,
        file_path=finding.file_path,
        risk_score=finding.risk_score,
        created_at=finding.created_at,
        tasks_count=len(finding.tasks),
        is_verified_fixed=is_fixed,
        original_data=finding.original_data,
        tasks=[
            TaskResponse(
                id=t.id,
                finding_id=t.finding_id,
                title=t.title,
                description=t.description,
                assignee=t.assignee,
                status=t.status,
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
            for t in finding.tasks
        ],
        verifications=[
            VerificationResponse(
                id=v.id,
                finding_id=v.finding_id,
                task_id=v.task_id,
                evidence_description=v.evidence_description,
                evidence_url=v.evidence_url,
                verification_result=v.verification_result,
                created_at=v.created_at,
            )
            for v in finding.verifications
        ],
    )


@router.post(
    "/{id}/remediation-guidance",
    response_model=RemediationGuidanceResponse,
    summary="Generate AI-assisted remediation recommendations with transparent rule-based fallback",
)
def generate_remediation_guidance(id: int, db: Session = Depends(get_db)):
    finding = FindingService.get_finding(db=db, finding_id=id)
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Finding with ID {id} not found.")

    return AIRemediationService.generate_guidance(finding)


@router.post(
    "/{id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a remediation task assigned to a finding",
)
def create_finding_task(
    id: int,
    task_in: TaskCreate,
    db: Session = Depends(get_db),
):
    try:
        task = TaskService.create_task(db=db, finding_id=id, task_in=task_in)
        return TaskResponse(
            id=task.id,
            finding_id=task.finding_id,
            title=task.title,
            description=task.description,
            assignee=task.assignee,
            status=task.status,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e).strip("'"))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/{id}/verification",
    response_model=VerificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record manual or automated verification evidence that a vulnerability is fixed",
)
def record_verification(
    id: int,
    verification_in: VerificationCreate,
    db: Session = Depends(get_db),
):
    try:
        evidence = VerificationService.create_verification(
            db=db, finding_id=id, verification_in=verification_in
        )
        return VerificationResponse(
            id=evidence.id,
            finding_id=evidence.finding_id,
            task_id=evidence.task_id,
            evidence_description=evidence.evidence_description,
            evidence_url=evidence.evidence_url,
            verification_result=evidence.verification_result,
            created_at=evidence.created_at,
        )
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e).strip("'"))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{id}/verification",
    response_model=List[VerificationResponse],
    summary="List all recorded verification evidence for a finding",
)
def list_verifications(id: int, db: Session = Depends(get_db)):
    try:
        evidences = VerificationService.list_verifications_for_finding(db=db, finding_id=id)
        return [
            VerificationResponse(
                id=e.id,
                finding_id=e.finding_id,
                task_id=e.task_id,
                evidence_description=e.evidence_description,
                evidence_url=e.evidence_url,
                verification_result=e.verification_result,
                created_at=e.created_at,
            )
            for e in evidences
        ]
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e).strip("'"))
