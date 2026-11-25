import { useState } from 'react';
import type { FormEvent } from 'react';
import { History, MessageSquare, Plus, Search, Shield } from 'lucide-react';
import { useConversationRegistry } from './conversationRegistry';
import { Button } from '@/components/ui/Button';

interface Props {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Conversations opened in this browser tab. Each one is loaded from the backend
 * when selected. A complete, cross-session history needs a conversation-list
 * endpoint, which the backend does not provide yet.
 */
export function ConversationHistory({ activeId, onSelect, onNew }: Props) {
  const { items } = useConversationRegistry();
  const [lookup, setLookup] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  const submitLookup = (e: FormEvent) => {
    e.preventDefault();
    const id = lookup.trim();
    if (!UUID_RE.test(id)) {
      setLookupError('Enter a valid conversation ID (UUID).');
      return;
    }
    setLookupError(null);
    setLookup('');
    onSelect(id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-line">
        <Button variant="primary" size="md" onClick={onNew} leftIcon={<Plus className="w-4 h-4" />} className="w-full">
          New chat
        </Button>
      </div>

      <div className="px-3 pt-4 pb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
        <History className="w-3.5 h-3.5" />
        This session
      </div>

      <nav aria-label="Conversations" className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {items.length === 0 ? (
          <p className="px-2 py-3 text-xs text-fg-subtle leading-relaxed">
            Conversations you start or open appear here. Messages are stored by the backend; this list only covers this
            browser tab.
          </p>
        ) : (
          items.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              aria-current={c.id === activeId ? 'true' : undefined}
              className={`w-full text-left rounded-lg px-2.5 py-2 transition-colors cursor-pointer ${
                c.id === activeId ? 'bg-primary/15 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
              }`}
            >
              <span className="flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-fg-subtle" />
                <span className="min-w-0">
                  <span className="block text-[13px] truncate">{c.title}</span>
                  {c.findingLabel && (
                    <span className="flex items-center gap-1 text-[11px] text-fg-subtle truncate">
                      <Shield className="w-3 h-3 shrink-0" />
                      <span className="truncate">{c.findingLabel}</span>
                    </span>
                  )}
                </span>
              </span>
            </button>
          ))
        )}
      </nav>

      <form onSubmit={submitLookup} className="p-3 border-t border-line space-y-1.5">
        <label htmlFor="conv-lookup" className="text-[11px] font-medium text-fg-subtle">
          Open a saved conversation by ID
        </label>
        <div className="flex gap-1.5">
          <input
            id="conv-lookup"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder="Conversation UUID"
            className="flex-1 min-w-0 rounded-md border border-line bg-canvas px-2 py-1.5 text-xs font-mono text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary/60"
          />
          <button type="submit" className="inline-flex items-center justify-center w-8 rounded-md border border-line text-fg-muted hover:text-fg hover:bg-surface-2 cursor-pointer" aria-label="Open conversation">
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
        {lookupError && <p className="text-[11px] text-critical">{lookupError}</p>}
      </form>
    </div>
  );
}
