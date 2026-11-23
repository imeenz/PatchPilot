import { apiClient } from './api';
import type { ChatRequest, ChatResponse, ConversationDetailResponse } from '@/types';

/**
 * Conversational assistant — backend contract (app/schemas/chat.py):
 *
 *  POST /api/v1/chat
 *    body:  { message, conversation_id?, finding_id? }
 *    - omit conversation_id to start a NEW conversation; the response returns its id
 *    - a conversation can be linked to at most one finding
 *  GET  /api/v1/chat/conversations/{id}
 *
 * There is no conversation-list endpoint, and no simulated responder: if the
 * backend is unavailable, the error is surfaced to the user.
 */
export const chatService = {
  sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return apiClient<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  getConversation(id: string): Promise<ConversationDetailResponse> {
    return apiClient<ConversationDetailResponse>(`/chat/conversations/${encodeURIComponent(id)}`);
  },
};

/** Backend limits (app/schemas/chat.py, app/services/chat_service.py). */
export const CHAT_LIMITS = {
  maxMessageLength: 4000,
  maxMessagesPerConversation: 50,
} as const;
