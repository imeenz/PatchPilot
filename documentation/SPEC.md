# PatchPilot — Project Specification

## 1. Overview
PatchPilot is an AI-assisted security remediation management platform. It helps teams import security findings, prioritize vulnerabilities, generate remediation recommendations, assign tasks, track progress, and verify resolution.

## 2. Problem
Security tools identify vulnerabilities, but teams still need to understand the findings, decide what to fix first, assign responsibility, and verify that remediation succeeded.

PatchPilot centralizes this workflow.

## 3. Objectives
- Import and validate security findings.
- Classify vulnerabilities.
- Calculate transparent priority scores.
- Generate AI-assisted remediation guidance.
- Assign and track remediation tasks.
- Verify remediation using evidence.

## 4. Users
- Team members: review findings and update assigned tasks.
- Reviewers: prioritize findings and assign remediation work.
- Administrators: manage users and workspace where implemented.

## 5. Functional Requirements

### F1 — Import Findings
- Import findings from JSON files.
- Validate required fields and data types.
- Reject malformed files.
- Handle invalid severity values safely.

Minimum fields:
- title
- description
- severity
- source
- affected_component
- identifier

### F2 — Findings Dashboard
- Display findings and severity counts.
- List vulnerability details.
- Filter by severity and status.
- Open individual finding details.

### F3 — Risk Prioritization
- Normalize severity values.
- Calculate a documented priority score.
- Explain contributing factors.
- Handle missing or invalid inputs.

### F4 — AI Remediation Assistant
- Explain the vulnerability.
- Describe potential impact.
- Recommend remediation steps.
- Mention uncertainty and compatibility concerns.
- Provide verification steps.

AI must not invent unsupported technical facts. Recommendations require human review.

### F5 — Task Management
- Create tasks linked to findings.
- Assign tasks to team members.
- Track statuses: Open, In Progress, Blocked, Completed.
- Reject invalid assignments and status transitions.

### F6 — Verification
- Record verification notes or evidence.
- Record whether the issue is still detected or resolved.
- Do not consider a completed task automatically resolved.
- Require successful verification before marking a finding resolved.

## 6. User Stories and Acceptance Criteria

### US-01 Import Findings
As a team member, I want to import JSON findings.

Acceptance:
- Valid JSON is accepted.
- Invalid JSON is rejected.
- Missing required fields are handled clearly.
- Import results are displayed.

### US-02 Review Findings
As a team member, I want to view and filter findings.

Acceptance:
- Findings are displayed correctly.
- Details can be opened.
- Filters return matching findings.

### US-03 Prioritize Findings
As a reviewer, I want explainable risk scores.

Acceptance:
- Scores follow documented rules.
- Scores remain within the defined range.
- Contributing factors are explained.

### US-04 Request AI Guidance
As a team member, I want remediation recommendations.

Acceptance:
- Recommendations include explanations and steps.
- Verification guidance is included.
- AI failures are handled.
- Output is identified as advisory.

### US-05 Assign Tasks
As a reviewer, I want to assign remediation work.

Acceptance:
- Tasks reference existing findings.
- Assignees must be valid.
- Unauthorized actions are rejected.

### US-06 Track Progress
As a team member, I want to update task status.

Acceptance:
- Only valid statuses are accepted.
- Updates persist.
- Completed tasks do not automatically resolve findings.

### US-07 Verify Remediation
As a reviewer, I want to verify completed remediation.

Acceptance:
- Verification evidence is recorded.
- Failed verification leaves the finding unresolved.
- Successful verification updates the finding status.

## 7. Non-Functional Requirements
- Backend input validation.
- Authorization for protected operations.
- Clear error handling.
- Maintainable code structure.
- Explainable risk calculations.
- Traceable task and verification history.

## 8. Technology Stack
- React, TypeScript, Vite, Tailwind CSS.
- Python, FastAPI.
- PostgreSQL.
- SQLAlchemy, Alembic.
- LLM accessed through backend service.
- pytest.

## 9. Out of Scope
- Automatic patch deployment.
- Production system modifications.
- Multiple commercial scanner integrations.
- Live threat intelligence.
- Complex enterprise permissions.
- Multi-agent AI orchestration.

## 10. Definition of Done
A feature is complete when acceptance criteria are met, relevant tests pass, defects are documented, and the implementation is reviewed.
