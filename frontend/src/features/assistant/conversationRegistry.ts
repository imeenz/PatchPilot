import { useSyncExternalStore } from 'react';

/**
 * In-memory index of conversations opened in THIS browser tab.
 *
 * The backend has no "list conversations" endpoint (only GET /chat/conversations/{id}),
 * so a full history list is not possible yet — see docs/BACKEND_REQUESTS.md.
 * Only ids and titles are kept here, in memory (never localStorage); every
 * conversation's messages are always loaded from the backend.
 */
export interface ConversationRef {
  id: string;
  title: string;
  findingLabel: string | null;
  updatedAt: string;
}

let items: ConversationRef[] = [];
let activeId: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const conversationRegistry = {
  upsert(ref: ConversationRef) {
    items = [ref, ...items.filter((i) => i.id !== ref.id)];
    emit();
  },
  remove(id: string) {
    items = items.filter((i) => i.id !== id);
    if (activeId === id) activeId = null;
    emit();
  },
  setActive(id: string | null) {
    activeId = id;
    emit();
  },
  getActive: () => activeId,
  getItems: () => items,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useConversationRegistry() {
  const list = useSyncExternalStore(conversationRegistry.subscribe, conversationRegistry.getItems);
  const active = useSyncExternalStore(conversationRegistry.subscribe, conversationRegistry.getActive);
  return { items: list, activeId: active };
}
