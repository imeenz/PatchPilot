import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CHAT_LIMITS } from '@/services/chatService';
import { buildPastedFindingMessage, DEFAULT_PASTE_QUESTION } from './messageBuilders';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
}

export function PasteFindingModal({ isOpen, onClose, onSubmit }: Props) {
  const [snippet, setSnippet] = useState('');
  const [question, setQuestion] = useState(DEFAULT_PASTE_QUESTION);
  const message = buildPastedFindingMessage(snippet, question);
  const tooLong = message.length > CHAT_LIMITS.maxMessageLength;

  const submit = () => {
    if (!snippet.trim() || tooLong) return;
    onSubmit(message);
    setSnippet('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Paste a vulnerability finding"
      description="Paste scanner output, an advisory or a bug report. It is sent to the assistant as text."
      maxWidth="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!snippet.trim() || tooLong}>
            Analyze finding
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="paste-snippet" className="text-xs font-medium text-fg-muted">
            Finding text
          </label>
          <textarea
            id="paste-snippet"
            autoFocus
            value={snippet}
            onChange={(e) => setSnippet(e.target.value)}
            rows={9}
            placeholder={'e.g. CVE-…, package name, installed/fixed versions, scanner description…'}
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm font-mono text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary/60"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="paste-question" className="text-xs font-medium text-fg-muted">
            What would you like to know?
          </label>
          <textarea
            id="paste-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary/60"
          />
        </div>
        <p className={`text-xs ${tooLong ? 'text-critical' : 'text-fg-subtle'}`}>
          {message.length}/{CHAT_LIMITS.maxMessageLength} characters
          {tooLong && '. The backend accepts at most 4000 characters per message; shorten the finding text.'}
        </p>
      </div>
    </Modal>
  );
}
