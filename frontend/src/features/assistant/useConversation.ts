import { useCallback, useRef, useState } from 'react';
import { chatService, CHAT_LIMITS } from '@/services/chatService';
import type { ChatRequest, FindingContextSummary, LocalCard, UIChatMessage } from '@/types';
import { conversationRegistry } from './conversationRegistry';

let localSeq = 0;
const localId = (prefix: string) => `${prefix}-${Date.now()}-${++localSeq}`;

export interface SendError {
  error: unknown;
  text: string;
}

/**
 * Conversation state for the assistant. The backend is the source of truth:
 *  - a new conversation is created by POST /chat without conversation_id
 *  - existing conversations are (re)loaded with GET /chat/conversations/{id}
 *  - a message is only marked "delivered" once the backend has accepted it
 */
export function useConversation() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIChatMessage[]>([]);
  const [findingContext, setFindingContext] = useState<FindingContextSummary | null>(null);
  /** Finding chosen by the user, sent as finding_id with the next message. */
  const [pendingFinding, setPendingFinding] = useState<FindingContextSummary | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<SendError | null>(null);

  // Guards against responses from a conversation the user already left.
  const generation = useRef(0);

  const persistedCount = messages.filter((m) => !m.localCard && m.status === 'delivered').length;
  const isFull = persistedCount >= CHAT_LIMITS.maxMessagesPerConversation - 1;

  const reset = useCallback(() => {
    generation.current++;
    setConversationId(null);
    setTitle(null);
    setMessages([]);
    setFindingContext(null);
    setPendingFinding(null);
    setLoadError(null);
    setSendError(null);
    setIsSending(false);
    setIsLoadingConversation(false);
    conversationRegistry.setActive(null);
  }, []);

  const load = useCallback(async (id: string) => {
    const gen = ++generation.current;
    setIsLoadingConversation(true);
    setLoadError(null);
    setSendError(null);
    setMessages([]);
    setPendingFinding(null);
    setConversationId(id);
    try {
      const conv = await chatService.getConversation(id);
      if (gen !== generation.current) return;
      setTitle(conv.title);
      setFindingContext(conv.finding_context);
      setMessages(
        conv.messages.map((m) => ({
          id: m.message_id,
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
          createdAt: m.created_at,
          status: 'delivered',
          isFallback: m.is_fallback,
          provider: m.provider,
          model: m.model,
        }))
      );
      conversationRegistry.upsert({
        id: conv.conversation_id,
        title: conv.title || 'Untitled conversation',
        findingLabel: conv.finding_context ? `#${conv.finding_context.id} ${conv.finding_context.title}` : null,
        updatedAt: conv.updated_at,
      });
      conversationRegistry.setActive(conv.conversation_id);
    } catch (err) {
      if (gen !== generation.current) return;
      setLoadError(err);
    } finally {
      if (gen === generation.current) setIsLoadingConversation(false);
    }
  }, []);

  const send = useCallback(
    async (rawText: string, opts: { replaceFailedId?: string } = {}) => {
      const text = rawText.trim();
      if (!text || isSending) return;
      if (text.length > CHAT_LIMITS.maxMessageLength) {
        setSendError({ error: new Error(`Messages are limited to ${CHAT_LIMITS.maxMessageLength} characters.`), text });
        return;
      }
      const gen = generation.current;
      const userMsg: UIChatMessage = {
        id: localId('user'),
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      setMessages((prev) => [...prev.filter((m) => m.id !== opts.replaceFailedId), userMsg]);
      setIsSending(true);
      setSendError(null);

      const request: ChatRequest = { message: text };
      if (conversationId) request.conversation_id = conversationId;
      if (pendingFinding) request.finding_id = pendingFinding.id;

      try {
        const res = await chatService.sendMessage(request);
        if (gen !== generation.current) return;
        setConversationId(res.conversation_id);
        if (res.finding_context) setFindingContext(res.finding_context);
        setPendingFinding(null);
        setMessages((prev) => [
          ...prev.map((m) => (m.id === userMsg.id ? { ...m, status: 'delivered' as const } : m)),
          {
            id: res.message_id,
            role: 'assistant',
            content: res.content,
            createdAt: res.created_at,
            status: 'delivered',
            isFallback: res.is_fallback,
            provider: res.provider,
            model: res.model,
            structuredGuidance: res.structured_guidance,
          },
        ]);
        const convTitle = title ?? (text.length > 60 ? text.slice(0, 60) : text);
        if (!title) setTitle(convTitle);
        const fc = res.finding_context ?? findingContext;
        conversationRegistry.upsert({
          id: res.conversation_id,
          title: convTitle,
          findingLabel: fc ? `#${fc.id} ${fc.title}` : null,
          updatedAt: res.created_at,
        });
        conversationRegistry.setActive(res.conversation_id);
      } catch (err) {
        if (gen !== generation.current) return;
        setMessages((prev) => prev.map((m) => (m.id === userMsg.id ? { ...m, status: 'failed' as const } : m)));
        setSendError({ error: err, text });
      } finally {
        if (gen === generation.current) setIsSending(false);
      }
    },
    [conversationId, pendingFinding, isSending, title, findingContext]
  );

  const retry = useCallback(() => {
    if (!sendError) return;
    const failed = [...messages].reverse().find((m) => m.status === 'failed' && m.content === sendError.text);
    void send(sendError.text, { replaceFailedId: failed?.id });
  }, [sendError, messages, send]);

  /**
   * Link a workspace finding. The backend allows one finding per conversation,
   * so choosing a different finding than the linked one starts a new conversation.
   * Returns true when a new conversation was started.
   */
  const attachFinding = useCallback(
    (finding: FindingContextSummary): boolean => {
      if (findingContext && findingContext.id === finding.id) return false;
      if (conversationId && findingContext && findingContext.id !== finding.id) {
        reset();
        setPendingFinding(finding);
        return true;
      }
      setPendingFinding(finding);
      return false;
    },
    [conversationId, findingContext, reset]
  );

  const clearPendingFinding = useCallback(() => setPendingFinding(null), []);

  /** Shows a card (e.g. an import result) in this view only. It is not part of the saved conversation. */
  const addLocalCard = useCallback((card: LocalCard) => {
    setMessages((prev) => [
      ...prev,
      { id: localId('card'), role: 'assistant', content: '', createdAt: new Date().toISOString(), status: 'delivered', localCard: card },
    ]);
  }, []);

  return {
    conversationId,
    title,
    messages,
    findingContext,
    pendingFinding,
    isLoadingConversation,
    loadError,
    isSending,
    sendError,
    isFull,
    load,
    send,
    retry,
    reset,
    attachFinding,
    clearPendingFinding,
    addLocalCard,
    dismissSendError: () => setSendError(null),
  };
}

export type ConversationState = ReturnType<typeof useConversation>;
