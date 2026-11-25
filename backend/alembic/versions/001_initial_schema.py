"""initial schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-11-20 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # findings table
    op.create_table(
        'findings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(length=50), nullable=False),
        sa.Column('cve_id', sa.String(length=50), nullable=True),
        sa.Column('package_name', sa.String(length=255), nullable=True),
        sa.Column('installed_version', sa.String(length=100), nullable=True),
        sa.Column('fixed_version', sa.String(length=100), nullable=True),
        sa.Column('source', sa.String(length=100), nullable=False, server_default='json_import'),
        sa.Column('file_path', sa.String(length=1000), nullable=True),
        sa.Column('risk_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('original_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_findings_id'), 'findings', ['id'], unique=False)
    op.create_index(op.f('ix_findings_title'), 'findings', ['title'], unique=False)
    op.create_index(op.f('ix_findings_severity'), 'findings', ['severity'], unique=False)
    op.create_index(op.f('ix_findings_cve_id'), 'findings', ['cve_id'], unique=False)
    op.create_index(op.f('ix_findings_package_name'), 'findings', ['package_name'], unique=False)
    op.create_index(op.f('ix_findings_source'), 'findings', ['source'], unique=False)

    # remediation_tasks table
    op.create_table(
        'remediation_tasks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('finding_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('assignee', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='Open'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['finding_id'], ['findings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_remediation_tasks_id'), 'remediation_tasks', ['id'], unique=False)
    op.create_index(op.f('ix_remediation_tasks_finding_id'), 'remediation_tasks', ['finding_id'], unique=False)
    op.create_index(op.f('ix_remediation_tasks_status'), 'remediation_tasks', ['status'], unique=False)
    op.create_index(op.f('ix_remediation_tasks_assignee'), 'remediation_tasks', ['assignee'], unique=False)

    # verification_evidence table
    op.create_table(
        'verification_evidence',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('finding_id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=True),
        sa.Column('evidence_description', sa.Text(), nullable=False),
        sa.Column('evidence_url', sa.String(length=1000), nullable=True),
        sa.Column('verification_result', sa.String(length=50), nullable=False, server_default='Verified Fixed'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['finding_id'], ['findings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['task_id'], ['remediation_tasks.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_verification_evidence_id'), 'verification_evidence', ['id'], unique=False)
    op.create_index(op.f('ix_verification_evidence_finding_id'), 'verification_evidence', ['finding_id'], unique=False)
    op.create_index(op.f('ix_verification_evidence_task_id'), 'verification_evidence', ['task_id'], unique=False)
    op.create_index(op.f('ix_verification_evidence_verification_result'), 'verification_evidence', ['verification_result'], unique=False)


def downgrade() -> None:
    op.drop_table('verification_evidence')
    op.drop_table('remediation_tasks')
    op.drop_table('findings')
