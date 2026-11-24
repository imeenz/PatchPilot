import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationDetailResponse,
)
from app.services.chat_service import ChatService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post(
    "",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Send a conversational message to the AI security assistant",
    description=(
        "Send a message to PatchPilot. Supports new conversations, continuing existing conversations "
        "via conversation_id, optional association with a finding_id, multi-turn history, and "
        "transparent rule-based fallback when no external provider is available."
    ),
)
def send_chat_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
):
    try:
        return ChatService.send_message(db=db, request=request)
    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e).strip("'"),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Unexpected error in chat endpoint (%s).", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the chat message.",
        )


@router.get(
    "/conversations/{id}",
    response_model=ConversationDetailResponse,
    summary="Get conversation details and message history",
    description="Retrieve full chronological message history and metadata for a conversation by UUID.",
)
def get_conversation(
    id: str,
    db: Session = Depends(get_db),
):
    try:
        return ChatService.get_conversation(db=db, conversation_id=id)
    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e).strip("'"),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Unexpected error retrieving conversation (%s).", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while retrieving the conversation.",
        )
