import pytest
from app.services.risk_scoring import RiskScoringService


def test_baseline_risk_scores():
    score_crit, exp_crit = RiskScoringService.calculate_score("Critical")
    assert score_crit == 95.0
    assert "Critical" in exp_crit
    assert "prioritization score" in exp_crit

    score_high, _ = RiskScoringService.calculate_score("High")
    assert score_high == 75.0

    score_med, _ = RiskScoringService.calculate_score("Medium")
    assert score_med == 50.0

    score_low, _ = RiskScoringService.calculate_score("Low")
    assert score_low == 25.0

    score_info, _ = RiskScoringService.calculate_score("Informational")
    assert score_info == 5.0


def test_risk_scoring_case_insensitivity():
    score, _ = RiskScoringService.calculate_score("critical")
    assert score == 95.0

    score_mod, _ = RiskScoringService.calculate_score("moderate")
    assert score_mod == 50.0


def test_risk_scoring_adjustments():
    # Critical with CVE (+2) and Fix (+1) = 98.0
    score, exp = RiskScoringService.calculate_score("Critical", has_cve=True, has_fix=True)
    assert score == 98.0
    assert "known public CVE" in exp
    assert "fixed version" in exp


def test_risk_scoring_capping():
    # 95 + 2 + 1 = 98 (capped under 100)
    score, _ = RiskScoringService.calculate_score("Critical", has_cve=True, has_fix=True)
    assert score <= 100.0


def test_invalid_severity():
    with pytest.raises(ValueError):
        RiskScoringService.calculate_score("Catastrophic")
