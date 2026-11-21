from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.task import TaskResponse, TaskUpdate
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get(
    "",
    response_model=List[TaskResponse],
    summary="List tasks with optional filtering by finding, status, or assignee",
)
def list_tasks(
    finding_id: Optional[int] = Query(None, description="Filter by finding ID"),
    status: Optional[str] = Query(None, description="Filter by status (Open, In Progress, Blocked, Completed)"),
    assignee: Optional[str] = Query(None, description="Filter by assignee name"),
    db: Session = Depends(get_db),
):
    try:
        tasks = TaskService.list_tasks(
            db=db, finding_id=finding_id, status=status, assignee=assignee
        )
        return [
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
            for t in tasks
        ]
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{id}",
    response_model=TaskResponse,
    summary="Get task details by ID",
)
def get_task(id: int, db: Session = Depends(get_db)):
    task = TaskService.get_task(db=db, task_id=id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {id} not found.",
        )
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


@router.patch(
    "/{id}",
    response_model=TaskResponse,
    summary="Update task details or status. Note: Completing a task does NOT automatically mark a vulnerability as fixed.",
)
def update_task(id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    try:
        task = TaskService.update_task(db=db, task_id=id, task_update=task_in)
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
