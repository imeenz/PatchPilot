# PatchPilot — Test Cases

Initial execution status for every case: Not Run.

| ID | Scenario | Expected Result | Type | Priority | Status |
|---|---|---|---|---|---|
| TC-001 | Import valid JSON | Findings imported | Positive | High | Not Run |
| TC-002 | Import malformed JSON | Clear validation error | Negative | High | Not Run |
| TC-003 | Import record missing title | Record rejected or reported | Negative | High | Not Run |
| TC-004 | Import empty JSON array | Clear empty-state response | Boundary | Medium | Not Run |
| TC-005 | Import unsupported file type | File rejected | Negative | Medium | Not Run |
| TC-006 | Import oversized file | File safely rejected | Boundary | Medium | Not Run |
| TC-007 | Import duplicate identifiers | Documented duplicate policy applied | Negative | Medium | Not Run |
| TC-008 | Open dashboard with findings | Correct counts displayed | Functional | High | Not Run |
| TC-009 | Filter by severity | Matching findings displayed | Functional | Medium | Not Run |
| TC-010 | Filter by status | Matching findings displayed | Functional | Medium | Not Run |
| TC-011 | Open finding details | Correct details displayed | Functional | High | Not Run |
| TC-012 | Open empty dashboard | Empty state displayed | Boundary | Low | Not Run |
| TC-013 | Score critical finding | Correct documented score | Functional | High | Not Run |
| TC-014 | Score low finding | Correct documented score | Functional | Medium | Not Run |
| TC-015 | Submit unknown severity | Invalid input handled safely | Negative | High | Not Run |
| TC-016 | Submit out-of-range CVSS | Invalid value rejected | Boundary | Medium | Not Run |
| TC-017 | Score with missing optional data | Safe deterministic score | Boundary | Medium | Not Run |
| TC-018 | Request AI recommendation | Explanation and remediation steps returned | Functional | High | Not Run |
| TC-019 | Request AI guidance with insufficient data | Uncertainty identified | Negative | High | Not Run |
| TC-020 | AI service unavailable | Graceful error handling | Negative | High | Not Run |
| TC-021 | AI returns empty response | Invalid response handled | Negative | High | Not Run |
| TC-022 | Check AI verification guidance | Verification steps included | Quality | Medium | Not Run |
| TC-023 | Check AI unsupported claims | No fabricated technical details | Quality | High | Not Run |
| TC-024 | Create task for existing finding | Task created and linked | Functional | High | Not Run |
| TC-025 | Create task for nonexistent finding | Request rejected | Negative | High | Not Run |
| TC-026 | Assign task to invalid user | Assignment rejected | Negative | Medium | Not Run |
| TC-027 | Update task through valid statuses | Status changes persist | Functional | High | Not Run |
| TC-028 | Submit invalid task status | Update rejected | Negative | Medium | Not Run |
| TC-029 | Unauthorized task update | Backend denies operation | Security | High | Not Run |
| TC-030 | Verify finding with successful evidence | Finding marked verified resolved | Functional | High | Not Run |
| TC-031 | Submit failed verification | Finding remains unresolved | Functional | High | Not Run |
| TC-032 | Complete task without verification | Finding remains unresolved | Negative | High | Not Run |
| TC-033 | Verify nonexistent finding | Request rejected | Negative | Medium | Not Run |
| TC-034 | Submit empty verification evidence | Validation error where required | Boundary | Medium | Not Run |
| TC-035 | Complete import-to-verification workflow | Full workflow succeeds | End-to-end | High | Not Run |
| TC-036 | Refresh after task update | Latest status persists | Integration | Medium | Not Run |

## Execution Record
For each test, record actual result, pass/fail/blocked status, date, tester, build, evidence, and related defect ID.
