import uuid
from unittest.mock import patch
import httpx
import pytest

from app.core.config import settings
from app.services.chat_service import ChatService


def test_new_conversation_creation(client):
    """Test creating a new conversation without prior conversation_id."""
    payload = {"message": "How do I prevent SQL injection in Python?"}
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["conversation_id"] is not None
    assert uuid.UUID(data["conversation_id"])  # Valid UUID
    assert data["message_id"] is not None
    assert data["role"] == "assistant"
    assert "SQL" in data["content"] or "Injection" in data["content"]
    assert data["is_fallback"] is True
    assert data["provider"] == "rule-based-fallback"
    assert data["finding_context"] is None
    assert "disclaimer" in data


def test_continuing_existing_conversation(client):
    """Test multi-turn conversation carrying context forward."""
    # Turn 1
    resp1 = client.post("/api/v1/chat", json={"message": "What is XSS?"})
    assert resp1.status_code == 200
    conv_id = resp1.json()["conversation_id"]

    # Turn 2
    resp2 = client.post(
        "/api/v1/chat",
        json={"conversation_id": conv_id, "message": "Can you give me an example of DOM XSS?"},
    )
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["conversation_id"] == conv_id
    assert data2["role"] == "assistant"

    # Verify conversation has 4 messages total (user1, asst1, user2, asst2)
    conv_resp = client.get(f"/api/v1/chat/conversations/{conv_id}")
    assert conv_resp.status_code == 200
    conv_data = conv_resp.json()
    assert len(conv_data["messages"]) == 4
    assert conv_data["messages"][0]["role"] == "user"
    assert conv_data["messages"][0]["content"] == "What is XSS?"
    assert conv_data["messages"][1]["role"] == "assistant"
    assert conv_data["messages"][2]["role"] == "user"
    assert conv_data["messages"][2]["content"] == "Can you give me an example of DOM XSS?"
    assert conv_data["messages"][3]["role"] == "assistant"


def test_conversation_history_persistence(client):
    """Test that message history is stored in chronological order."""
    resp = client.post("/api/v1/chat", json={"message": "First message"})
    conv_id = resp.json()["conversation_id"]

    client.post("/api/v1/chat", json={"conversation_id": conv_id, "message": "Second message"})
    client.post("/api/v1/chat", json={"conversation_id": conv_id, "message": "Third message"})

    conv_resp = client.get(f"/api/v1/chat/conversations/{conv_id}")
    assert conv_resp.status_code == 200
    messages = conv_resp.json()["messages"]
    assert len(messages) == 6

    user_contents = [m["content"] for m in messages if m["role"] == "user"]
    assert user_contents == ["First message", "Second message", "Third message"]


def test_finding_linked_conversation(client):
    """Test linking a conversation to an imported finding."""
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
            }
        ],
    )
    finding_id = import_resp.json()["imported_findings"][0]["id"]

    chat_resp = client.post(
        "/api/v1/chat",
        json={"finding_id": finding_id, "message": "How do I fix this log4j finding?"},
    )
    assert chat_resp.status_code == 200
    data = chat_resp.json()

    assert data["finding_context"] is not None
    assert data["finding_context"]["id"] == finding_id
    assert data["finding_context"]["package_name"] == "log4j-core"
    assert data["finding_context"]["fixed_version"] == "2.17.1"
    assert data["structured_guidance"] is not None
    assert "log4j-core" in data["content"]
    assert "2.17.1" in data["content"]


def test_invalid_finding_id(client):
    """Test that specifying a nonexistent finding ID returns 404."""
    resp = client.post(
        "/api/v1/chat",
        json={"finding_id": 99999, "message": "Explain this vulnerability."},
    )
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()


def test_rule_based_fallback_when_no_provider(client):
    """Test deterministic rule-based fallback when no external provider is set."""
    with patch.object(settings, "AI_PROVIDER", None), patch.object(settings, "AI_API_KEY", None):
        resp = client.post("/api/v1/chat", json={"message": "Tell me about CSRF tokens."})
        assert resp.status_code == 200
        data = resp.json()

        assert data["is_fallback"] is True
        assert data["provider"] == "rule-based-fallback"
        assert data["model"] is None
        assert "CSRF" in data["content"]
        assert "disclaimer" in data


def test_ai_provider_configured_success(client):
    """Test external AI provider flow when configured and mock succeeds."""
    mock_llm_json = {
        "choices": [
            {
                "message": {
                    "content": "To prevent SQL injection, use parameterized queries with your database driver."
                }
            }
        ]
    }

    with patch.object(settings, "AI_PROVIDER", "openai"), \
         patch.object(settings, "AI_API_KEY", "test-key-mock"), \
         patch.object(settings, "AI_MODEL", "gpt-4o-mini"), \
         patch.object(ChatService, "_post_to_provider", return_value=mock_llm_json):

        resp = client.post("/api/v1/chat", json={"message": "How do I prevent SQL injection?"})
        assert resp.status_code == 200
        data = resp.json()

        assert data["is_fallback"] is False
        assert data["provider"] == "openai"
        assert data["model"] == "gpt-4o-mini"
        assert "parameterized queries" in data["content"]


def test_ai_provider_failure_graceful_fallback(client):
    """Test that external provider network/timeout failures engage fallback without crashing."""
    with patch.object(settings, "AI_PROVIDER", "openai"), \
         patch.object(settings, "AI_API_KEY", "test-key-mock"), \
         patch.object(ChatService, "_post_to_provider", side_effect=httpx.ConnectError("Connection refused")):

        resp = client.post("/api/v1/chat", json={"message": "How do I secure JWT tokens?"})
        assert resp.status_code == 200
        data = resp.json()

        assert data["is_fallback"] is True
        assert data["provider"] == "rule-based-fallback"
        assert "unavailable" in data["content"].lower() or "ConnectError" in data["content"]
        assert "Authentication" in data["content"] or "JWT" in data["content"] or "Token" in data["content"]


def test_invalid_or_oversized_message(client):
    """Test rejection of empty, whitespace-only, or oversized messages."""
    # Empty message
    resp_empty = client.post("/api/v1/chat", json={"message": ""})
    assert resp_empty.status_code == 422

    # Whitespace only
    resp_whitespace = client.post("/api/v1/chat", json={"message": "   \n\t   "})
    assert resp_whitespace.status_code == 422

    # Oversized message (>4000 chars)
    oversized = "A" * 4001
    resp_oversized = client.post("/api/v1/chat", json={"message": oversized})
    assert resp_oversized.status_code == 422


def test_conversation_retrieval(client):
    """Test GET /api/v1/chat/conversations/{id}."""
    post_resp = client.post("/api/v1/chat", json={"message": "Initial security inquiry"})
    conv_id = post_resp.json()["conversation_id"]

    get_resp = client.get(f"/api/v1/chat/conversations/{conv_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()

    assert data["conversation_id"] == conv_id
    assert len(data["messages"]) == 2
    assert data["messages"][0]["role"] == "user"
    assert data["messages"][0]["content"] == "Initial security inquiry"
    assert data["messages"][1]["role"] == "assistant"
    assert data["title"] is not None


def test_nonexistent_conversation(client):
    """Test 404 handling when querying or continuing a nonexistent conversation."""
    random_uuid = str(uuid.uuid4())

    # GET nonexistent
    get_resp = client.get(f"/api/v1/chat/conversations/{random_uuid}")
    assert get_resp.status_code == 404
    assert "not found" in get_resp.json()["detail"].lower()

    # POST nonexistent
    post_resp = client.post(
        "/api/v1/chat",
        json={"conversation_id": random_uuid, "message": "Hello?"},
    )
    assert post_resp.status_code == 404
    assert "not found" in post_resp.json()["detail"].lower()


def test_invalid_uuid_format(client):
    """Test that malformed UUID returns 422 or 400."""
    resp = client.get("/api/v1/chat/conversations/not-a-valid-uuid")
    assert resp.status_code in (400, 422)

    resp2 = client.post("/api/v1/chat", json={"conversation_id": "bad-uuid", "message": "Hi"})
    assert resp2.status_code in (400, 422)


def test_message_limit_enforcement(client, db_session):
    """Test that conversation rejects messages beyond the 50 message limit."""
    resp = client.post("/api/v1/chat", json={"message": "First message"})
    conv_id = resp.json()["conversation_id"]

    # Current count: 2 (1 user + 1 assistant)
    # We will simulate 48 more messages to reach 50 total (25 pairs)
    from app.models.conversation import ConversationMessage

    for i in range(48):
        role = "user" if i % 2 == 0 else "assistant"
        db_session.add(ConversationMessage(
            conversation_id=conv_id,
            role=role,
            content=f"Bulk message {i}",
        ))
    db_session.commit()

    # Verify conversation now has 50 messages
    detail_resp = client.get(f"/api/v1/chat/conversations/{conv_id}")
    assert detail_resp.status_code == 200
    assert len(detail_resp.json()["messages"]) == 50

    # The 51st message must be rejected with 400 Bad Request
    rejected_resp = client.post(
        "/api/v1/chat",
        json={"conversation_id": conv_id, "message": "Attempting 51st message"},
    )
    assert rejected_resp.status_code == 400
    assert "limit" in rejected_resp.json()["detail"].lower()


def test_malformed_provider_response(client):
    """Test that malformed or empty provider output falls back gracefully."""
    # Empty content in choice
    mock_bad_json = {
        "choices": [
            {
                "message": {
                    "content": "   "
                }
            }
        ]
    }

    with patch.object(settings, "AI_PROVIDER", "openai"), \
         patch.object(settings, "AI_API_KEY", "test-key-mock"), \
         patch.object(ChatService, "_post_to_provider", return_value=mock_bad_json):

        resp = client.post("/api/v1/chat", json={"message": "Explain Path Traversal."})
        assert resp.status_code == 200
        data = resp.json()

        assert data["is_fallback"] is True
        assert data["provider"] == "rule-based-fallback"
        assert "Path Traversal" in data["content"] or "Arbitrary File" in data["content"]
