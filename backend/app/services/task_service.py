from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.finding import Finding
from app.models.task import RemediationTask
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.schemas.common import TaskStatus


class TaskService:

    @classmethod
    def create_task(
        cls,
        db: Session,
        finding_id: int,
        task_in: TaskCreate,
    ) -> RemediationTask:
        # Validate finding exists
        finding = db.get(Finding, finding_id)
        if not finding:
            raise KeyError(f"Finding with ID {finding_id} not found.")

        task = RemediationTask(
            finding_id=finding_id,
            title=task_in.title.strip(),
            description=task_in.description.strip() if task_in.description else None,
            assignee=task_in.assignee.strip() if task_in.assignee else None,
            status=task_in.status,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @classmethod
    def list_tasks(
        cls,
        db: Session,
        finding_id: Optional[int] = None,
        status: Optional[str] = None,
        assignee: Optional[str] = None,
    ) -> List[RemediationTask]:
        stmt = select(RemediationTask)

        if finding_id is not None:
            stmt = stmt.where(RemediationTask.finding_id == finding_id)

        if status:
            norm_status = TaskStatus.normalize(status).value
            stmt = stmt.where(RemediationTask.status == norm_status)

        if assignee and assignee.strip():
            stmt = stmt.where(RemediationTask.assignee.ilike(f"%{assignee.strip()}%"))

        stmt = stmt.order_by(RemediationTask.id.desc())
        return list(db.scalars(stmt).all())

    @classmethod
    def get_task(cls, db: Session, task_id: int) -> Optional[RemediationTask]:
        return db.get(RemediationTask, task_id)

    @classmethod
    def update_task(
        cls,
        db: Session,
        task_id: int,
        task_update: TaskUpdate,
    ) -> RemediationTask:
        task = db.get(RemediationTask, task_id)
        if not task:
            raise KeyError(f"Task with ID {task_id} not found.")

        # Update provided fields
        if task_update.title is not None:
            task.title = task_update.title.strip()
        if task_update.description is not None:
            task.description = task_update.description.strip() if task_update.description else None
        if task_update.assignee is not None:
            task.assignee = task_update.assignee.strip() if task_update.assignee else None
        if task_update.status is not None:
            task.status = task_update.status

        # IMPORTANT ARCHITECTURAL RULE:
        # Completing a task does NOT create verification or mark finding fixed.
        # Verification remains an independent evidence recording step.

        db.commit()
        db.refresh(task)
        return task
