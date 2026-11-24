# PatchPilot — Test Execution Report

## Report purpose and status

This report records the manual execution of TC-005, TC-006, TC-008, TC-009, and TC-011 by Tester 1 on 2026-11-25. All other manual case results remain unrecorded. The case statuses below preserve the register state except for TC-005, TC-006, TC-008, TC-009, and TC-011. Keep developer automation results separate from Tester 1/Tester 2 execution results.

Execution record updated against branch `qa/integration-baseline`, repository HEAD `e69aa79278467e0bfbf6486e0dac2bc6d5e930ea`. TC-005, TC-006, TC-008, TC-009, and TC-011 were manually executed on 2026-11-25; other execution fields remain pending.

## 1. Execution information

| Field | Execution record |
|---|---|
| Project | PatchPilot |
| Report/run identifier | Tester 1 manual QA record for TC-005, TC-006, TC-008, TC-009, and TC-011; formal run ID undocumented |
| Build/version | Undocumented |
| Tested commit SHA | `e69aa79278467e0bfbf6486e0dac2bc6d5e930ea` (recorded in the Tester 1 evidence register for the five executed cases) |
| Branch | `qa/integration-baseline` (recorded with the Tester 1 evidence) |
| Test environment | Undocumented (OS, browser/version, network/origin, and relevant configuration not recorded) |
| Backend version | Undocumented for this manual run |
| Frontend version | Undocumented for this manual run |
| Execution period | 2026-11-25 (time and timezone undocumented) |
| Tester 1 | Tester 1 - QA Test Analyst; personal name undocumented |
| Tester 2 | Separate contribution recorded in `documentation/evidence/tester-2/TESTER_2_FINAL_REPORT.md`; personal name undocumented |
| Developer support | Undocumented |
| Test data | Per-case data is described in the individual case records; complete run-level data inventory undocumented |
| Database setup | Undocumented for this manual run. The preview database path in the plan is guidance, not evidence of use. |
| AI configuration | Undocumented for this manual run |
| Execution notes | Run-level constraints and deviations are undocumented. |

The preview database path documented in the test plan is setup guidance, not evidence that a database was created or used during this report run. Record the actual isolated database and confirm it does not target production or the developer default database.

## 2. Execution summary

### Counting rules

- **Total cases** is the unique case count in the register: 56.
- The 53 cases classified `MVP` are executable in this build scope. Each has exactly one execution state: Passed, Failed, Blocked, or Not Run. These four counts must sum to 53.
- Deferred and Out of MVP are scope classifications, not execution outcomes, and are counted separately: TC-007 is Deferred; TC-026 and TC-029 are Out of MVP. They must not also be counted in the 53 executable-case state totals.
- The initial register-derived state was 0 Passed, 0 Failed, 0 Blocked, 53 Not Run, 1 Deferred, and 2 Out of MVP. The run result reflects TC-005, TC-006, TC-008, TC-009, and TC-011 only; update other statuses only with recorded evidence.
- Recalculate after each run. `Total cases = Passed + Failed + Blocked + Not Run + Deferred + Out of MVP`.

| Measure | Initial register state | Run result |
|---|---:|---:|
| Total cases | 56 | 56 |
| Passed (executable MVP) | 0 | 5 |
| Failed (executable MVP) | 0 | 0 |
| Blocked (executable MVP) | 0 | 0 |
| Not Run (executable MVP) | 53 | 48 |
| Deferred | 1 | 1 |
| Out of MVP | 2 | 2 |

**Reconciliation check:** `Passed + Failed + Blocked + Not Run = 53`; `Deferred + Out of MVP = 3`; the two subtotals sum to 56. Report any mismatch as a documentation error before sign-off.

## 3. Test results

The objective and scope labels below are carried over from `documentation/TEST_CASES.md`. Tester, execution date, actual result, evidence, and retest fields remain blank for cases not yet run. Record `Pass`, `Fail`, `Blocked`, or `Not Run` only after evaluating the case against the specified build. Use the separate scope tables for deferred/out-of-MVP cases; do not treat them as executable MVP results.

### 3.1 Executable MVP cases (53)

| Test ID | Test objective | Priority | Tester | Execution date | Actual result | Status | Evidence reference | Related bug ID | Retest status |
|---|---|---|---|---|---|---|---|---|---|
| TC-001 | Import a valid native PatchPilot JSON array and verify the created finding | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-002 | Reject syntactically malformed JSON | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-003 | Report and omit a native import record missing title | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-004 | Import an empty native array | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-005 | Reject a file that is neither named JSON nor typed as JSON | Medium / MVP | Tester 1 — QA Test Analyst | 2026-11-25 | `"unsupported.txt" is not a .json file. Export the report from your scanner in JSON format.` No finding was imported. No defect discovered. | Passed | `documentation/evidence/tester-1/TC-005/TC-005_02_unsupported-file-rejected.png` | — | Not applicable |
| TC-006 | Reject a scanner report exceeding 10 MB | Medium / MVP | Tester 1 — QA Test Analyst | 2026-11-25 | `The file is 11.0 MB. The maximum supported size is 10 MB.` No report was imported. No defect discovered. | Passed | `documentation/evidence/tester-1/TC-006/TC-006_01_oversized-file-rejected.png` | — | Not applicable |
| TC-037 | Assert Trivy parser classifications and mapped fields without running a scanner | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-038 | Assert OWASP ZAP parser risk mapping and alert fields without running ZAP | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-039 | Assert parser rejection and entry-level invalid/unsupported handling | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-040 | Exercise file extension/MIME acceptance independently of parsing | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-008 | Verify dashboard totals and severity counts with known findings | High / MVP | Tester 1 — QA Test Analyst | 2026-11-25 | PASS: 2 findings imported, 0 rejected. Critical risk score 95; Low risk score 25. Dashboard: total 2; Critical 1; High 0; Medium 0; Low 1; Informational 0; average risk score 60.0. | Passed | `documentation/evidence/tester-1/TC-008/TC-008_01_import-preview.png`; `documentation/evidence/tester-1/TC-008/TC-008_02_import-result.png`; `documentation/evidence/tester-1/TC-008/TC-008_03_dashboard-metrics.png` | — | Not applicable |
| TC-009 | Filter findings by severity | Medium / MVP | Tester 1 — QA Test Analyst | 2026-11-25 | The severity filter worked correctly. The catalog displayed one Critical finding, matching the selected filter. | Passed | `documentation/evidence/tester-1/TC-009/TC-009_Filter_Findings_By_Severity.png` | — | Not applicable |
| TC-010 | Filter findings by source (replaces unsupported status filter) | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-011 | View Finding Details | High / MVP | Tester 1 — QA Test Analyst | 2026-11-25 | Title: Prototype pollution in minimist; severity: Critical; CVE: CVE-2021-44906; package: minimist; affected version: 1.2.5; fixed version: 1.2.6; risk score: 98.0; source: Trivy; vulnerable path: package-lock.json. | Passed | `documentation/evidence/tester-1/TC-011/TC-011_Finding_Details.png` | — | Not applicable |
| TC-012 | View dashboard when workspace has no findings | Low / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-013 | Check Critical base score and adjustments | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-014 | Check Low severity base score without adjustments | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-015 | Reject unsupported severity while retaining valid records | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-016 | Exercise supported risk-score boundaries and maximum adjustment combination (replaces CVSS test) | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-017 | Score finding when optional CVE and version fields are absent | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-041 | Verify supported finding filters and their combinations | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-042 | Exercise findings pagination and query bounds | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-043 | Verify finding detail includes related tasks and evidence history | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-044 | Check all severity bases and CVE/fix adjustments; verify attainable score range | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-018 | Request finding-specific remediation guidance and validate response contract | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-019 | Review guidance when finding context is incomplete | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-020 | Verify chat falls back when configured provider fails | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-021 | Verify empty or malformed chat provider content falls back | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-022 | Evaluate verification advice in AI response | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-023 | Review AI output for unsupported factual claims | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-045 | Ask a general cybersecurity question without linking a finding | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-046 | Evaluate finding-linked AI analysis for accuracy, uncertainty, and safety | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-047 | Verify multi-turn context is sent to provider and conversation history persists | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-048 | Reject conflicting finding association on an existing conversation | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-049 | Check chat message and conversation boundaries | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-050 | Verify provider/fallback metadata for finding-specific guidance | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-024 | Create task linked to existing finding | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-025 | Reject task creation for nonexistent finding | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-027 | Update task through all supported statuses and verify persistence | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-028 | Reject an unsupported task status | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-036 | Verify task status survives refresh/retrieval | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-030 | Record first successful verification for a finding | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-031 | Ensure a newer failed result supersedes prior successful evidence | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-032 | Confirm task completion alone does not verify finding | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-033 | Reject evidence for nonexistent finding | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-034 | Reject empty and whitespace-only evidence description | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-035 | Exercise actual import-to-task-to-verification workflow | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-051 | Verify all four canonical evidence outcomes and historical breakdown | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-052 | Validate evidence task reference and finding/task relationship | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-053 | Verify exact dashboard metrics from the inline controlled fixture | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-054 | Check backend health when ready and when required tables are missing | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-055 | Check observable loading, empty, filtered-empty, and error/retry UI states | Medium / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |
| TC-056 | Verify CORS and safe API error presentation | High / MVP | [ ] | [ ] | [ ] | Not Run | [ ] | — | [ ] |

#### TC-005 execution detail

| Field | Execution record |
|---|---|
| Test ID | TC-005 |
| Tester | Tester 1 — QA Test Analyst |
| Date | 2026-11-25 |
| Objective | Reject unsupported file type in scanner report import. |
| Input | `unsupported.txt` |
| Expected result | Unsupported file rejected. |
| Actual result | PatchPilot displayed: `"unsupported.txt" is not a .json file. Export the report from your scanner in JSON format.` No finding was imported. |
| Verdict | PASS |
| Finding / defect | No finding was imported. No defect discovered. |
| Evidence | `documentation/evidence/tester-1/TC-005/TC-005_02_unsupported-file-rejected.png` |

#### TC-006 execution detail

| Field | Execution record |
|---|---|
| Test ID | TC-006 |
| Tester | Tester 1 — QA Test Analyst |
| Date | 2026-11-25 |
| Objective | Verify the 10 MB scanner-report upload limit. |
| Input | Valid JSON file of 11 MB (`oversized-valid.json`). |
| Expected result | Files exceeding 10 MB are rejected. |
| Actual result | PatchPilot displayed: `The file is 11.0 MB. The maximum supported size is 10 MB.` No report was imported. |
| Verdict | PASS |
| Finding / defect | No report was imported. No defect discovered. |
| Evidence | `documentation/evidence/tester-1/TC-006/TC-006_01_oversized-file-rejected.png` |

#### TC-008 execution detail

| Field | Execution record |
|---|---|
| Test ID | TC-008 |
| Tester | Tester 1 — QA Test Analyst |
| Date | 2026-11-25 |
| Objective | Verify dashboard totals and severity counts with known findings. |
| Import preview | 2 valid findings; 0 unsupported; 0 invalid. |
| Import result | 2 imported; 0 rejected. |
| Critical finding risk score | 95 |
| Low finding risk score | 25 |
| Total findings | 2 |
| Critical | 1 |
| High | 0 |
| Medium | 0 |
| Low | 1 |
| Informational | 0 |
| Average risk score | 60.0 |
| Verdict | PASS |
| Evidence | `TC-008_01_import-preview.png`; `TC-008_02_import-result.png`; `TC-008_03_dashboard-metrics.png` (under `documentation/evidence/tester-1/TC-008/`) |

#### TC-009 execution detail

| Field | Execution record |
|---|---|
| Test ID | TC-009 |
| Tester | Tester 1 — QA Test Analyst |
| Date | 2026-11-25 |
| Feature | Vulnerabilities Catalog |
| Test type | Functional / UI |
| Priority | Medium |
| Precondition | The application contains imported vulnerability findings. |
| Test steps | Opened the Vulnerabilities Catalog, selected Critical in the Severity dropdown, and observed the displayed findings. |
| Expected result | Only findings matching the selected Critical severity should be displayed. |
| Actual result | The severity filter worked correctly. The catalog displayed one Critical finding, matching the selected filter. |
| Verdict | PASS |
| Evidence | `documentation/evidence/tester-1/TC-009/TC-009_Filter_Findings_By_Severity.png` |

#### TC-011 execution detail

| Field | Execution record |
|---|---|
| Test ID | TC-011 |
| Tester | Tester 1 — QA Test Analyst |
| Date | 2026-11-25 |
| Feature | Finding Details |
| Test type | Functional / UI |
| Priority | High |
| Precondition | At least one vulnerability finding has been imported. |
| Test steps | Opened the Vulnerabilities Catalog, located the Critical minimist vulnerability, clicked Inspect, and reviewed the displayed vulnerability details. |
| Expected result | The finding detail page should correctly display the vulnerability title, severity, CVE identifier, affected package and version, fixed version, risk score, detection source, and vulnerable path. |
| Actual result | Title: Prototype pollution in minimist; severity: Critical; CVE: CVE-2021-44906; package: minimist; affected version: 1.2.5; fixed version: 1.2.6; risk score: 98.0; source: Trivy; vulnerable path: package-lock.json. |
| Verdict | PASS |
| Evidence | `documentation/evidence/tester-1/TC-011/TC-011_Finding_Details.png` |

### 3.2 Deferred case (1)

| Test ID | Test objective | Scope / reason | Tester | Execution date | Actual result | Status | Evidence reference | Related bug ID | Retest status |
|---|---|---|---|---|---|---|---|---|---|
| TC-007 | Define and test duplicate-import behavior | Medium / Deferred; execute only after policy is specified | [ ] | [ ] | [ ] | Deferred | [ ] | — | [ ] |

### 3.3 Out-of-MVP cases (2)

| Test ID | Test objective | Scope / reason | Tester | Execution date | Actual result | Status | Evidence reference | Related bug ID | Retest status |
|---|---|---|---|---|---|---|---|---|---|
| TC-026 | Validate assignee against a user account | Medium / Out of MVP; not executable until the required capability and acceptance rules exist | [ ] | [ ] | [ ] | Out of MVP | [ ] | — | [ ] |
| TC-029 | Deny an unauthorized task update | High / Out of MVP; not executable until the required capability and acceptance rules exist | [ ] | [ ] | [ ] | Out of MVP | [ ] | — | [ ] |

## 4. Defect summary

Use `documentation/BUG_REPORTS.md` as the official defect register. Do not create a confirmed bug from code inspection alone. Include new defects only when supported by reproducible observations or clearly label them as suspected/pending reproduction.

### New defects found during this execution

| Bug ID | Title | Severity | Priority | Related test(s) | Reproduction/evidence reference | Status | Owner / disposition |
|---|---|---|---|---|---|---|---|
| [Assign only after triage] | [Record observed defect; do not infer] | [ ] | [ ] | [ ] | [Evidence ID/path] | [ ] | [ ] |

If none are found, record “None observed in this execution” only after completing and reconciling the executed scope. Do not leave blank and imply a clean run.

### Previously known fixed bugs

| Bug ID | Summary | Fix commit | Developer regression reference | Independent QA status |
|---|---|---|---|---|
| BUG-P0-001 | Invalid verification results and latest-evidence status integrity | `03423ee29088ffcc79bc97d343061bc5365fd8cd` | `backend/tests/test_verification.py`; `backend/tests/test_dashboard.py` | Independent Tester 1 retest not documented; record this run's result below if executed |
| BUG-INT-001 | Database isolation, readiness/CORS, and frontend API error handling | `f65628bf048fe740d70fc18403f5f073730a8372` | `backend/tests/test_integration_isolation.py`; `backend/tests/test_health.py`; `backend/tests/test_chat.py`; `frontend/tests/apiPresentation.test.mjs` | Browser verification and independent Tester 1 retest pending in source records; record this run's result below if executed |

### Suspected issue awaiting reproduction

| Suspected issue | Reference | Current evidence state | Execution disposition |
|---|---|---|---|
| BUG-VER-001: whitespace-only `evidence_description` may pass validation and be stripped before storage | `documentation/TEST_CASES.md` TC-034 | Not confirmed; TC-034 remains Not Run and no runtime reproduction is documented in `documentation/BUG_REPORTS.md` | Record an observed result only after executing TC-034; do not list as a confirmed defect before reproduction |

### Retested defects

| Bug ID | Retest build/commit | Retest case(s) | Result | Evidence | Regression outcome | Tester/date |
|---|---|---|---|---|---|---|
| [Record confirmed retests only] | [ ] | [ ] | [ ] | [Evidence ID] | [ ] | [ ] |

## 5. Evidence register

Assign evidence IDs during execution. Use real repository-relative paths or approved evidence-store references. Do not invent screenshots, logs, or artifact locations. Avoid secrets and sensitive production data.

| Evidence ID | Related test/bug | Description | File/path or approved reference | Date | Tester | Build/commit |
|---|---|---|---|---|---|---|
| TC-005-E02 | TC-005 | Screenshot of unsupported `.txt` rejection message | `documentation/evidence/tester-1/TC-005/TC-005_02_unsupported-file-rejected.png` | 2026-11-25 | Tester 1 — QA Test Analyst | `e69aa79278467e0bfbf6486e0dac2bc6d5e930ea` |
| TC-006-E01 | TC-006 | Screenshot of oversized JSON file rejection message | `documentation/evidence/tester-1/TC-006/TC-006_01_oversized-file-rejected.png` | 2026-11-25 | Tester 1 — QA Test Analyst | `e69aa79278467e0bfbf6486e0dac2bc6d5e930ea` |
| TC-008-E01 | TC-008 | Import preview: two valid findings, zero unsupported and invalid | `documentation/evidence/tester-1/TC-008/TC-008_01_import-preview.png` | 2026-11-25 | Tester 1 — QA Test Analyst | `e69aa79278467e0bfbf6486e0dac2bc6d5e930ea` |
| TC-008-E02 | TC-008 | Import result: two imported, zero rejected | `documentation/evidence/tester-1/TC-008/TC-008_02_import-result.png` | 2026-11-25 | Tester 1 — QA Test Analyst | `e69aa79278467e0bfbf6486e0dac2bc6d5e930ea` |
| TC-008-E03 | TC-008 | Overview dashboard metrics and average risk score 60.0 | `documentation/evidence/tester-1/TC-008/TC-008_03_dashboard-metrics.png` | 2026-11-25 | Tester 1 — QA Test Analyst | `e69aa79278467e0bfbf6486e0dac2bc6d5e930ea` |
| TC-009-E01 | TC-009 | Vulnerabilities Catalog with Critical severity selected and one matching finding displayed | `documentation/evidence/tester-1/TC-009/TC-009_Filter_Findings_By_Severity.png` | 2026-11-25 | Tester 1 — QA Test Analyst | `e69aa79278467e0bfbf6486e0dac2bc6d5e930ea` |
| TC-011-E01 | TC-011 | Finding details for Critical minimist vulnerability, including package, versions, risk score, source, and vulnerable path | `documentation/evidence/tester-1/TC-011/TC-011_Finding_Details.png` | 2026-11-25 | Tester 1 — QA Test Analyst | `e69aa79278467e0bfbf6486e0dac2bc6d5e930ea` |

Evidence should be sufficient for another tester to reproduce the observation. Record exact commands and outputs for automation separately from manual UI/API observations.

## 6. Retest and regression record

A developer test result is not an independent QA retest. Record the exact retest steps and observed outcome; link supporting evidence and relevant regression runs.

| Original bug | Fix commit | Retest steps performed | Actual result | Evidence reference | Regression outcome | Tester/date |
|---|---|---|---|---|---|---|
| BUG-P0-001 | `03423ee29088ffcc79bc97d343061bc5365fd8cd` | [Exercise invalid/blank/null result rejection, omitted-result default, and newer evidence controlling current status across relevant API/dashboard surfaces; identify cases actually run] | [Not yet recorded] | [ ] | [Not yet recorded] | [ ] |
| BUG-INT-001 | `f65628bf048fe740d70fc18403f5f073730a8372` | [Exercise isolated startup/request DB behavior, health readiness, CORS/error handling, frontend network/HTTP states, and chat persistence as applicable; identify cases actually run] | [Not yet recorded; browser check pending until performed] | [ ] | [Not yet recorded] | [ ] |

Do not mark either bug independently retested from the developer regression results listed in the AI log or test plan. Preserve browser verification as pending until an actual browser run is recorded.

## 7. AI evaluation

Use the planned 0–14 reviewer rubric in `documentation/TEST_CASES.md` (TC-019, TC-022, TC-023, TC-046, and related context case TC-047). **The rubric has not yet been executed** according to the current AI interaction log and test register. No score or AI pass/fail result is prefilled here. Evaluate generated advice as advisory and requiring human review.

### AI response evaluation record

| Field | Execution record |
|---|---|
| Related test ID(s) | [ ] |
| Exact prompt and follow-up context | [Record exact prompt used; do not reconstruct historical prompts] |
| Tested input / synthetic finding | [Record values and fixture] |
| Build/commit and execution date | [ ] |
| Provider/model or fallback | [Record observed provider/model or `rule-based-fallback`; no secrets] |
| AI response | [Preserve response or approved evidence reference] |
| Factual accuracy (0–2) | [ ] |
| Relevance (0–2) | [ ] |
| Uncertainty handling (0–2) | [ ] |
| Safety (0–2) | [ ] |
| Compatibility (0–2) | [ ] |
| Unsupported claims (0–2) | [ ] |
| Verification advice (0–2) | [ ] |
| Total (0–14) and rubric interpretation | [Calculate from seven scores; apply TEST_CASES.md thresholds] |
| Unsupported claims / source checks | [List claim, check/reference, and result; or None observed after review] |
| Human corrections and rationale | [Record accepted/rejected/modified advice and reason; or None] |
| Evidence | [Evidence ID/path] |
| Reviewer and final assessment | [ ] |

Record reviewer disagreement and rationale if multiple people score the response. A single response does not establish a hallucination rate or universal model behavior.

## 8. Final quality assessment

Complete this section after reconciling all result tables and evidence. Do not issue a release recommendation from an incomplete or unreconciled run.

- **Coverage:** [Report executed/53 MVP cases and any measured code coverage separately; do not infer coverage from case counts]
- **Major defects:** [Bug IDs and disposition, or none observed after defining completed scope]
- **Remaining risks:** [ ]
- **Known product limitations:** No authentication/authorization or user accounts; no conversation-list endpoint; no scanner execution; no GitHub integration, automatic patching, deployment, or production modifications; duplicate-import policy remains undefined; AI guidance remains advisory. Update only if verified against the tested build.
- **Outstanding tests:** [List Not Run/Blocked cases and reasons; browser integration and AI evaluation remain outstanding unless executed and evidenced]
- **Warnings and environment constraints:** [ ]
- **Entry/exit criteria met:** [Yes/No/Partial, with references]
- **Release recommendation:** [Recommend / Do not recommend / Conditional / Not assessed] — [Rationale and accepted residual risks]
- **Prepared by / reviewed by / dates:** [ ]

### Separation from developer validation

`documentation/TEST_PLAN.md` and `documentation/AI_INTERACTION_LOG.md` contain historical developer automation results for the QA baseline. Those results are not copied into this report's manual case outcomes and do not mark any TC-001–TC-056 case Pass. Reference the source documents when reporting developer checks for the tested commit; record actual execution outputs and warnings for this run separately.

## 9. Report completion checklist

- [ ] Tested commit, environment, execution period, database setup, and testers recorded.
- [ ] All 53 executable MVP cases have a reconciled status; every Pass/Fail/Blocked result has actual-result and evidence details.
- [ ] TC-007 remains Deferred unless duplicate-import policy is specified.
- [ ] TC-026 and TC-029 remain Out of MVP unless authentication/authorization and acceptance behavior are implemented.
- [ ] New findings are linked to `documentation/BUG_REPORTS.md` after triage; suspected issues remain clearly unconfirmed.
- [ ] Developer automation and independent manual QA are reported separately.
- [ ] AI rubric scores have supporting response, reviewer and evidence; otherwise remain unexecuted.
- [ ] Counts reconcile to 56 without double-counting scope classifications.
- [ ] Release recommendation and residual risks are reviewed and approved by the responsible owner.
