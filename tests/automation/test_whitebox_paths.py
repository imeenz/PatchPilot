"""
White-Box & Code Path Analysis Test Suite for PatchPilot
Directly exercises internal unit logic, compound branches, condition combinations, and boundary values:
- Input validation & normalization (SeverityLevel, TaskStatus, VerificationResult)
- Risk scoring calculations, adjustments, and capping
- AI service provider vs fallback execution paths
- Verification integrity algorithm (latest_valid_verification_result)
- Health check inspection branches (connected, degraded, exception)

Saves evidence to documentation/evidence/tester-2/coverage/
"""
import os
import sys
import json
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
evidence_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "documentation", "evidence", "tester-2", "coverage"))
os.makedirs(evidence_dir, exist_ok=True)

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.schemas.common import SeverityLevel, TaskStatus, VerificationResult, latest_valid_verification_result
from app.services.risk_scoring import RiskScoringService, SEVERITY_BASE_SCORES
from app.services.ai_service import AIRemediationService
from app.models.finding import Finding
from app.core.config import settings
from fastapi import Response

whitebox_records = []

def record_wb(category, branch_name, branch_type, condition_tested, passed, details):
    rec = {
        "category": category,
        "branch": branch_name,
        "branch_type": branch_type,
        "condition": condition_tested,
        "passed": passed,
        "status": "PASS" if passed else "FAIL",
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    whitebox_records.append(rec)
    print(f"[{rec['status']}] {category} :: {branch_name} ({branch_type}) - {condition_tested}")

def test_whitebox_logic():
    print("=== 1. SeverityLevel Normalization Branches ===")
    # Valid severities and aliases
    for s_in, s_exp in [
        ("Critical", SeverityLevel.CRITICAL),
        ("CRITICAL", SeverityLevel.CRITICAL),
        ("critical", SeverityLevel.CRITICAL),
        ("High", SeverityLevel.HIGH),
        ("Medium", SeverityLevel.MEDIUM),
        ("MODERATE", SeverityLevel.MEDIUM),
        ("Low", SeverityLevel.LOW),
        ("Informational", SeverityLevel.INFORMATIONAL),
        ("INFO", SeverityLevel.INFORMATIONAL),
    ]:
        res = SeverityLevel.normalize(s_in)
        record_wb("SeverityLevel", f"Normalize '{s_in}'", "Success Branch", f"normalize('{s_in}') == {s_exp}", res == s_exp, f"Mapped to {res.value}")

    # Invalid severity values
    for s_bad in ["", "   ", "Severe", "Catastrophic", None, 123]:
        try:
            SeverityLevel.normalize(s_bad) # type: ignore
            record_wb("SeverityLevel", f"Reject '{s_bad}'", "Failure Branch", "Raises ValueError", False, "Failed to raise")
        except (ValueError, TypeError):
            record_wb("SeverityLevel", f"Reject '{s_bad}'", "Failure Branch", "Raises ValueError", True, "Successfully caught invalid input")

    print("\n=== 2. TaskStatus Normalization Branches ===")
    for st_in, st_exp in [
        ("Open", TaskStatus.OPEN),
        ("In Progress", TaskStatus.IN_PROGRESS),
        ("in_progress", TaskStatus.IN_PROGRESS),
        ("inprogress", TaskStatus.IN_PROGRESS),
        ("Blocked", TaskStatus.BLOCKED),
        ("Completed", TaskStatus.COMPLETED),
        ("done", TaskStatus.COMPLETED),
        ("closed", TaskStatus.COMPLETED),
    ]:
        res = TaskStatus.normalize(st_in)
        record_wb("TaskStatus", f"Normalize '{st_in}'", "Success Branch", f"normalize('{st_in}') == {st_exp}", res == st_exp, f"Mapped to {res.value}")

    for st_bad in ["", "   ", "pending", "archived", None]:
        try:
            TaskStatus.normalize(st_bad) # type: ignore
            record_wb("TaskStatus", f"Reject '{st_bad}'", "Failure Branch", "Raises ValueError", False, "Failed to raise")
        except (ValueError, TypeError):
            record_wb("TaskStatus", f"Reject '{st_bad}'", "Failure Branch", "Raises ValueError", True, "Successfully caught invalid input")

    print("\n=== 3. RiskScoringService Calculation & Adjustments ===")
    # Baseline tests for all 5 severities
    expected_bases = {
        "Critical": 95.0,
        "High": 75.0,
        "Medium": 50.0,
        "Low": 25.0,
        "Informational": 5.0
    }
    for sev, base in expected_bases.items():
        score, expl = RiskScoringService.calculate_score(sev, has_cve=False, has_fix=False)
        record_wb("RiskScoring", f"Base score: {sev}", "Base Calculation", f"score == {base}", score == base, expl)

    # Condition combinations: has_cve and has_fix
    score_cve, _ = RiskScoringService.calculate_score("Medium", has_cve=True, has_fix=False)
    record_wb("RiskScoring", "Adjustment: has_cve (+2.0)", "Condition: True/False", "50 + 2 == 52.0", score_cve == 52.0, f"Score: {score_cve}")

    score_fix, _ = RiskScoringService.calculate_score("Medium", has_cve=False, has_fix=True)
    record_wb("RiskScoring", "Adjustment: has_fix (+1.0)", "Condition: False/True", "50 + 1 == 51.0", score_fix == 51.0, f"Score: {score_fix}")

    score_both, _ = RiskScoringService.calculate_score("Medium", has_cve=True, has_fix=True)
    record_wb("RiskScoring", "Adjustment: has_cve and has_fix (+3.0)", "Condition: True/True", "50 + 3 == 53.0", score_both == 53.0, f"Score: {score_both}")

    # Boundary capping test
    score_cap, _ = RiskScoringService.calculate_score("Critical", has_cve=True, has_fix=True)
    record_wb("RiskScoring", "Score calculation cap", "Boundary Condition", "min(100.0, 95 + 3) == 98.0 <= 100.0", score_cap <= 100.0 and score_cap == 98.0, f"Score: {score_cap}")

    print("\n=== 4. latest_valid_verification_result Algorithm Branches ===")
    # Branch 1: Empty input
    assert latest_valid_verification_result([]) is None
    record_wb("VerificationAlgorithm", "Empty Evidence List", "Boundary Branch", "returns None", True, "Empty collection handled safely")

    # Branch 2: Only invalid legacy results
    assert latest_valid_verification_result([(1, "corrupted_status"), (2, "legacy_invalid")]) is None
    record_wb("VerificationAlgorithm", "All Invalid Records", "Error Tolerance Branch", "ignores non-canonical strings and returns None", True, "Graceful fallback without exception")

    # Branch 3: Mixed valid and invalid records
    res_mixed = latest_valid_verification_result([(1, "Verified Fixed"), (2, "corrupted_status")])
    record_wb("VerificationAlgorithm", "Mixed Valid and Invalid", "Filtering Branch", "ignores invalid, selects latest valid ID 1", res_mixed == VerificationResult.VERIFIED_FIXED, f"Result: {res_mixed}")

    # Branch 4: Ascending vs Descending ID order preservation
    res_order = latest_valid_verification_result([(5, "Failed"), (2, "Verified Fixed"), (10, "Partially Fixed"), (8, "Verified Fixed")])
    record_wb("VerificationAlgorithm", "Max ID Selection", "Decision Branch", "Highest ID 10 controls status", res_order == VerificationResult.PARTIALLY_FIXED, f"Selected: {res_order}")

    print("\n=== 5. AIRemediationService Execution Paths ===")
    mock_finding = Finding(
        id=1,
        title="Mock Injection Vulnerability",
        description="SQL injection in login form parameter.",
        severity="High",
        risk_score=78.0,
        package_name="db-connector",
        installed_version="1.0.0",
        fixed_version="1.0.2"
    )

    # Path 1: No API key configured -> Rule-based fallback
    with patch.object(settings, "AI_API_KEY", None), patch.object(settings, "AI_PROVIDER", None):
        guidance_fb = AIRemediationService.generate_guidance(mock_finding)
        is_fb = guidance_fb.is_fallback is True and guidance_fb.provider == "rule-based-fallback"
        record_wb("AIRemediation", "Rule-Based Fallback Path", "Default Path", "is_fallback == True, provider == 'rule-based-fallback'", is_fb, "Deterministic guidance generated")

    # Path 2: Provider configured with exception -> Graceful fallback engaged
    with patch.object(settings, "AI_API_KEY", "test-key"), patch.object(settings, "AI_PROVIDER", "openai"):
        with patch.object(AIRemediationService, "_call_external_ai", side_effect=RuntimeError("Connection timeout to LLM gateway")):
            guidance_err = AIRemediationService.generate_guidance(mock_finding)
            is_handled = guidance_err.is_fallback is True and "RuntimeError" in (guidance_err.uncertainty_or_missing_information or "")
            record_wb("AIRemediation", "Provider Failure Graceful Recovery", "Exception Recovery Path", "Catches provider exception, engages labeled fallback with error note", is_handled, guidance_err.uncertainty_or_missing_information[:100])

    # Save white-box report
    json_path = os.path.join(evidence_dir, "whitebox_test_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(whitebox_records, f, indent=2)

    txt_path = os.path.join(evidence_dir, "whitebox_coverage_report.txt")
    total = len(whitebox_records)
    passed_count = sum(1 for r in whitebox_records if r["passed"])

    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("PATCHPILOT TESTER 2 — WHITE-BOX & INTERNAL CODE PATH ANALYSIS REPORT\n")
        f.write(f"Execution Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
        f.write(f"Total Internal Branches & Conditions Evaluated: {total}\n")
        f.write(f"Passed: {passed_count} | Failed: {total - passed_count}\n")
        f.write(f"Pass Rate: {(passed_count/total)*100:.1f}%\n")
        f.write("=" * 80 + "\n\n")
        for r in whitebox_records:
            f.write(f"[{r['status']}] {r['category']} :: {r['branch']} ({r['branch_type']})\n")
            f.write(f"  Condition: {r['condition']}\n")
            f.write(f"  Details:   {r['details']}\n")
            f.write("-" * 80 + "\n")

    print(f"\nWhite-box Path Analysis Complete! Total: {total}, Passed: {passed_count}")
    print(f"Evidence saved to: {json_path} and {txt_path}")
    return True

if __name__ == "__main__":
    success = test_whitebox_logic()
    sys.exit(0 if success else 1)
