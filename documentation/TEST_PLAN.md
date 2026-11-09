# PatchPilot — Test Plan

## 1. Purpose
Verify that PatchPilot meets its requirements and handles valid, invalid, and unexpected conditions.

## 2. Scope
- JSON import and validation.
- Findings dashboard and filters.
- Severity classification and risk calculation.
- AI remediation recommendations.
- Task assignment and status management.
- Verification and resolution.
- API authorization and frontend/backend integration.

## 3. Test Objectives
- Validate functional requirements.
- Identify validation and workflow defects.
- Test positive, negative, and boundary conditions.
- Evaluate AI recommendation quality.
- Verify that task completion is distinct from vulnerability resolution.

## 4. Test Approach

### Test Levels
- Unit testing.
- API testing.
- Integration testing.
- System testing.
- Manual exploratory testing.

### Test Types
- Functional testing.
- Negative testing.
- Boundary testing.
- Authorization testing.
- Regression testing.
- AI output evaluation.

### AI Evaluation
Evaluate whether AI recommendations:
- Are relevant to the supplied finding.
- Avoid unsupported technical claims.
- Provide actionable steps.
- Explain uncertainty.
- Include verification steps.
- Consider compatibility and security risks.

## 5. Test Environment
- Local development environment.
- Separate test database.
- Valid JSON test data.
- Invalid JSON and missing-field test data.
- Test accounts where authentication is implemented.
- AI test prompts and evaluation evidence.

## 6. Responsibilities
- Tester 1: requirements analysis, test plan, manual cases, exploratory testing, bug reporting and retesting.
- Tester 2: automation, execution, regression testing and evidence.
- Backend Developer: backend fixes and unit/API tests.
- Frontend Developer: UI fixes and integration support.

## 7. Entry Criteria
- Requirements are documented.
- A testable build or endpoint exists.
- Test data and environment are prepared.

## 8. Exit Criteria
- Critical and high-priority tests are executed or reported as blocked.
- Critical defects are fixed or documented.
- Fixes are retested.
- Remaining limitations are recorded.

## 9. Defect Severity
- Critical: core workflow unavailable or serious security failure.
- High: major feature failure.
- Medium: partial failure with workaround.
- Low: minor cosmetic or wording issue.

## 10. Schedule
- Nov 10: requirements review and test planning.
- Nov 11–12: test case design and test data.
- Nov 13–14: integration test preparation.
- Nov 14–15: functional and negative testing.
- Nov 16: regression and retesting.
- Nov 17: final test summary.

## 11. Deliverables
- Test plan.
- Test cases.
- Test datasets.
- Defect reports.
- Automated test scripts.
- Test execution evidence.
- Final test summary.
