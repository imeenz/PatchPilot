import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { KeyboardEvent, Ref } from 'react';
import { FileCode2, FileJson, Link2, Loader2, SendHorizontal } from 'lucide-react';
import { CHAT_LIMITS } from '@/services/chatService';

export interface ComposerHandle {
  setText: (text: string) => void;
  focus: () => void;
}

interface Props {
  ref?: Ref<ComposerHandle>;
  onSend: (text: string) => void;
  isSending: boolean;
  disabledReason?: string | null;
  onLinkFinding: () => void;
  onPasteFinding: () => void;
  onUploadReport: () => void;
  placeholder?: string;
}

const toolBtn =
  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60';

export function Composer({ ref, onSend, isSending, disabledReason, onLinkFinding, onPasteFinding, onUploadReport, placeholder }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    setText: (t: string) => {
      setText(t);
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    focus: () => textareaRef.current?.focus(),
  }));

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [text]);

  const trimmedLength = text.trim().length;
  const overLimit = text.trim().length > CHAT_LIMITS.maxMessageLength;
  const canSend = trimmedLength > 0 && !overLimit && !isSending && !disabledReason;

  const submit = () => {
    if (!canSend) return;
    onSend(text);
    setText('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-card focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
      <label htmlFor="assistant-composer" className="sr-only">
        Message PatchPilot
      </label>
      <textarea
        id="assistant-composer"
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={placeholder ?? 'Ask about a vulnerability, a remediation or how to verify a fix…'}
        className="block w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none leading-relaxed max-h-56"
        aria-describedby="composer-hint"
      />
      <div className="flex items-center justify-between gap-2 px-2 pb-2">
        <div className="flex items-center gap-0.5 flex-wrap">
          <button type="button" className={toolBtn} onClick={onLinkFinding} title="Attach a finding from your workspace as context">
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Attach finding</span>
          </button>
          <button type="button" className={toolBtn} onClick={onPasteFinding} title="Paste a vulnerability finding as text">
            <FileCode2 className="w-4 h-4" />
            <span className="hidden sm:inline">Paste finding</span>
          </button>
          <button type="button" className={toolBtn} onClick={onUploadReport} title="Upload a Trivy or OWASP ZAP JSON report">
            <FileJson className="w-4 h-4" />
            <span className="hidden sm:inline">Upload JSON report</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {text.length > CHAT_LIMITS.maxMessageLength * 0.85 && (
            <span className={`text-[11px] font-mono ${overLimit ? 'text-critical' : 'text-fg-subtle'}`}>
              {trimmedLength}/{CHAT_LIMITS.maxMessageLength}
            </span>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <p id="composer-hint" className="sr-only">
        Press Enter to send, Shift+Enter for a new line.
      </p>
      {disabledReason && <p className="px-4 pb-3 text-xs text-medium">{disabledReason}</p>}
    </div>
  );
}
