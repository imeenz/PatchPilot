from unittest.mock import patch
import httpx
from app.core.config import settings
from app.services.ai_service import AIRemediationService


def test_ai_fallback_when_no_api_key(client):
    # Ensure no API key
    with patch.object(settings, "AI_API_KEY", None), patch.object(settings, "AI_PROVIDER", None):
        import_resp = client.post(
            "/api/v1/findings/import",
            json=[
                {
                    "title": "Vulnerable library log4j",
                    "description": "Log4Shell JNDI injection vulnerability.",
                    "severity": "Critical",
                    "cve_id": "CVE-2021-44228",
                    "package_name": "log4j-core",
                    "installed_version": "2.14.1",
                    "fixed_version": "2.17.1",
                    "file_path": "pom.xml",
                }
            ],
        )
        finding_id = import_resp.json()["imported_findings"][0]["id"]

        guidance_resp = client.post(f"/api/v1/findings/{finding_id}/remediation-guidance")
        assert guidance_resp.status_code == 200
        guidance = guidance_resp.json()

        # Must be clearly labeled as fallback
        assert guidance["is_fallback"] is True
        assert guidance["provider"] == "rule-based-fallback"
        assert guidance["model"] is None

        # Verify all required fields
        assert "log4j-core" in guidance["vulnerability_explanation"]
        assert len(guidance["recommended_remediation_steps"]) >= 2
        assert any("2.17.1" in step for step in guidance["recommended_remediation_steps"])
        assert len(guidance["verification_steps"]) >= 1
        assert "compatibility_considerations" in guidance
        assert "uncertainty_or_missing_information" in guidance
        assert "disclaimer" in guidance


def test_ai_configured_provider_success(client):
    import_resp = client.post(
        "/api/v1/findings/import",
        json=[
            {
                "title": "Mocked AI finding",
                "description": "Mocked test description.",
                "severity": "High",
            }
        ],
    )
    finding_id = import_resp.json()["imported_findings"][0]["id"]

    mock_llm_json = {
        "choices": [
            {
                "message": {
                    "content": (
                        '{"vulnerability_explanation": "JNDI lookup vulnerability in log4j.", '
                        '"potential_impact": "Remote code execution by unauthenticated attacker.", '
                        '"recommended_remediation_steps": ["Upgrade to 2.17.1", "Sanitize logged inputs"], '
                        '"compatibility_considerations": "Java 8 or higher required.", '
                        '"verification_steps": ["Run mvn dependency:tree", "Test JNDI string payload"], '
                        '"uncertainty_or_missing_information": "Assuming standard JVM runtime."}'
                    )
                }
            }
        ]
    }

    # Patch only during the guidance request, targeting the ai service's provider method
    with patch.object(settings, "AI_PROVIDER", "openai"), \
         patch.object(settings, "AI_API_KEY", "test-key-mock"), \
         patch.object(settings, "AI_MODEL", "gpt-4o-mini"), \
         patch.object(AIRemediationService, "_post_to_provider", return_value=mock_llm_json):

        guidance_resp = client.post(f"/api/v1/findings/{finding_id}/remediation-guidance")
        assert guidance_resp.status_code == 200
        guidance = guidance_resp.json()

        assert guidance["is_fallback"] is False
        assert guidance["provider"] == "openai"
        assert guidance["model"] == "gpt-4o-mini"
        assert guidance["vulnerability_explanation"] == "JNDI lookup vulnerability in log4j."
        assert "Java 8 or higher" in guidance["compatibility_considerations"]


def test_ai_provider_failure_graceful_fallback(client, caplog):
    import_resp = client.post(
        "/api/v1/findings/import",
        json=[
            {
                "title": "Resilience finding",
                "description": "Test resilience against external AI failure.",
                "severity": "Medium",
            }
        ],
    )
    finding_id = import_resp.json()["imported_findings"][0]["id"]

    # Simulate network failure or timeout during external AI call
    secret = "test-api-key-must-not-appear"
    with patch.object(settings, "AI_PROVIDER", "openai"), \
         patch.object(settings, "AI_API_KEY", secret), \
         patch.object(AIRemediationService, "_post_to_provider", side_effect=httpx.ConnectError(f"Network unreachable {secret}")):

        guidance_resp = client.post(f"/api/v1/findings/{finding_id}/remediation-guidance")
        assert guidance_resp.status_code == 200
        guidance = guidance_resp.json()

        # Should seamlessly fall back to rule-based fallback without crashing
        assert guidance["is_fallback"] is True
        assert guidance["provider"] == "rule-based-fallback"
        assert "Configured AI provider" in guidance["uncertainty_or_missing_information"]
        assert "ConnectError" in guidance["uncertainty_or_missing_information"]
        assert secret not in caplog.text
