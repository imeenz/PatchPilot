# PatchPilot — Intelligent Security Remediation Assistant

PatchPilot helps development and security teams manage vulnerabilities from discovery through remediation and verification.

## Features
- Import security findings from JSON files.
- Classify vulnerabilities by severity.
- Calculate explainable risk scores.
- Generate AI-assisted remediation recommendations.
- Assign remediation tasks to team members.
- Track remediation progress.
- Verify whether vulnerabilities have been resolved.

## Technology Stack
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Python, FastAPI
- Database: PostgreSQL
- ORM: SQLAlchemy
- Migrations: Alembic
- AI: Large Language Model

## Backend Quickstart
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate | Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
Interactive API docs: `http://localhost:8000/docs`. See `backend/README.md` for full details.

## Workflow
1. Import security findings.
2. Validate and store findings.
3. Classify and prioritize vulnerabilities.
4. Generate AI remediation recommendations.
5. Assign remediation tasks.
6. Track progress.
7. Verify resolution.

## Safety
AI recommendations require human review. PatchPilot does not automatically modify source code or production systems.

## Team Roles
- Backend Developer
- Frontend Developer
- Tester 1
- Tester 2

## Repository Structure
frontend/
backend/
tests/
  manual/
  automation/
  integration/
documentation/

## Academic Project
This project evaluates AI-assisted development and testing. All significant AI interactions, human interventions, and validation results must be documented.
