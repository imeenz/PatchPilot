import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ClipboardCheck,
  History,
  Loader2,
  Microscope,
  PanelLeftClose,
  Shield,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import { useConversation } from '@/features/assistant/useConversation';
import { conversationRegistry } from '@/features/assistant/conversationRegistry';
import { ConversationHistory } from '@/features/assistant/ConversationHistory';
import { MessageItem } from '@/features/assistant/MessageItem';
import { Composer } from '@/features/assistant/Composer';
import type { ComposerHandle } from '@/features/assistant/Composer';
import { WelcomeScreen } from '@/features/assistant/WelcomeScreen';
import { FindingPickerModal } from '@/features/assistant/FindingPickerModal';
import { toContextSummary } from '@/features/assistant/messageBuilders';
import { PasteFindingModal } from '@/features/assistant/PasteFindingModal';
import { ReportImportModal } from '@/features/assistant/ReportImportModal';
import { Badge } from '@/components/ui/Badge';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { findingService } from '@/services/findingService';
import { useDemoMode } from '@/hooks/useDemoMode';
import type { FindingContextSummary } from '@/types';

const DISCLAIMER =
  'AI and rule-based guidance requires human review. PatchPilot does not automatically modify source code or systems.';

const ANALYZE_PROMPT =
  'Analyze the linked finding. Cover: 1) understanding, 2) risk and severity, 3) root cause, 4) potential impact, 5) recommended remediation, 6) compatibility considerations, 7) verification steps, 8) uncertainty or missing information. Use only the details stored for this finding.';

const VERIFY_PROMPT =
  'Create a verification checklist for the linked finding: which tests to run, what scanner evidence to collect, which regression tests are appropriate, and what would count as sufficient proof. Do not state that the vulnerability is fixed; the result will be recorded separately with evidence.';

export function AssistantPage() {
  const convo = useConversation();
  const demo = useDemoMode();
  const [params, setParams] = useSearchParams();
  const urlConversation = params.get('c');
  const urlFinding = params.get('finding');
  const urlImport = params.get('import');

  const composerRef = useRef<ComposerHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [guidanceState, setGuidanceState] = useState<{ loading: boolean; error: unknown }>({ loading: false, error: null });

  const linkedFinding: FindingContextSummary | null = convo.pendingFinding ?? convo.findingContext;
  const { load, reset, attachFinding, conversationId } = convo;

  // URL → state: load a conversation from the backend when ?c= changes.
  useEffect(() => {
    if (urlConversation) {
      if (urlConversation !== conversationId) void load(urlConversation);
    } else if (!conversationId) {
      // Returning to the assistant: reopen the conversation active in this tab (from the backend).
      const active = conversationRegistry.getActive();
      if (active) setParams({ c: active }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlConversation]);

  // State → URL: once the backend creates a conversation, reflect its id in the URL.
  useEffect(() => {
    if (conversationId && conversationId !== urlConversation) {
      setParams({ c: conversationId }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // ?finding=<id> (from Finding Details) → start a new conversation linked to that finding.
  useEffect(() => {
    if (!urlFinding) return;
    const id = Number(urlFinding);
    setParams({}, { replace: true });
    if (!Number.isInteger(id) || id <= 0) return;
    if (demo.isActive) {
      setNotice('Demo findings cannot be used as chat context. Exit demo mode to discuss real findings.');
      return;
    }
    findingService
      .getFinding(id)
      .then((res) => {
        reset();
        attachFinding(toContextSummary(res.data));
        setNotice(`Finding #${id} attached. Your next message starts a new conversation about it.`);
      })
      .catch((e) => setNotice(`Could not load finding #${id}: ${e instanceof Error ? e.message : String(e)}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlFinding]);

  // ?import=1 → open the report import dialog.
  useEffect(() => {
    if (urlImport) {
      setImportOpen(true);
      const next = new URLSearchParams(params);
      next.delete('import');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlImport]);

  // Keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [convo.messages.length, convo.isSending]);

  const startNew = useCallback(() => {
    reset();
    setNotice(null);
    setParams({}, { replace: false });
    setHistoryOpen(false);
    composerRef.current?.focus();
  }, [reset, setParams]);

  const selectConversation = (id: string) => {
    setNotice(null);
    setParams({ c: id });
    setHistoryOpen(false);
  };

  const handleAttach = (finding: FindingContextSummary) => {
    const startedNew = attachFinding(finding);
    if (startedNew) setParams({}, { replace: true });
    setNotice(
      startedNew
        ? `This conversation is already linked to finding #${convo.findingContext?.id}. A conversation can only have one finding, so a new conversation was started for #${finding.id}.`
        : `Finding #${finding.id} attached. It is sent with your next message.`
    );
  };

  const analyzeImportedFinding = (id: number) => {
    findingService
      .getFinding(id)
      .then((res) => {
        reset();
        setParams({}, { replace: true });
        attachFinding(toContextSummary(res.data));
        setNotice(`Finding #${id} attached in a new conversation. Use the quick actions or ask a question.`);
      })
      .catch((e) => setNotice(`Could not load finding #${id}: ${e instanceof Error ? e.message : String(e)}`));
  };

  const requestGuidance = async () => {
    if (!linkedFinding) return;
    setGuidanceState({ loading: true, error: null });
    try {
      const res = await findingService.getRemediationGuidance(linkedFinding.id);
      convo.addLocalCard({ kind: 'guidance', guidance: res.data });
      setGuidanceState({ loading: false, error: null });
    } catch (error) {
      setGuidanceState({ loading: false, error });
    }
  };

  const disabledReason = convo.isFull
    ? 'This conversation has reached the backend limit of 50 messages. Start a new chat to continue.'
    : convo.isLoadingConversation
      ? 'Loading conversation…'
      : convo.loadError
        ? 'The conversation could not be loaded.'
        : null;

  const isEmpty = convo.messages.length === 0 && !convo.isLoadingConversation && !convo.loadError;

  return (
    <div className={`flex-none flex min-h-0 overflow-hidden ${demo.isActive ? 'h-[calc(100dvh-7.5rem-2px)]' : 'h-[calc(100dvh-4rem-1px)]'}`}>
      {/* History panel */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-line bg-canvas-2">
        <ConversationHistory activeId={convo.conversationId} onSelect={selectConversation} onNew={startNew} />
      </aside>
      {historyOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setHistoryOpen(false)} aria-hidden="true" />
          <aside className="relative w-80 max-w-[85vw] h-full bg-canvas-2 border-r border-line flex flex-col">
            <button
              onClick={() => setHistoryOpen(false)}
              className="absolute right-2 top-2 p-1.5 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 cursor-pointer"
              aria-label="Close conversation history"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
            <div className="pt-8 flex-1 min-h-0 flex flex-col">
              <ConversationHistory activeId={convo.conversationId} onSelect={selectConversation} onNew={startNew} />
            </div>
          </aside>
        </div>
      )}

      {/* Conversation */}
      <section className="flex-1 min-w-0 flex flex-col" aria-label="AI Assistant conversation">
        <div className="border-b border-line px-4 sm:px-6 py-2.5 flex items-center gap-3 min-h-[3.25rem]">
          <button
            onClick={() => setHistoryOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-line text-xs text-fg-muted hover:text-fg cursor-pointer"
          >
            <History className="w-4 h-4" /> History
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold text-fg truncate">{convo.title ?? 'New conversation'}</h1>
            <p className="text-[11px] text-fg-subtle font-mono truncate">
              {convo.conversationId ? `Saved on backend · ${convo.conversationId}` : 'Not saved yet: created when you send the first message'}
            </p>
          </div>
        </div>

        {linkedFinding && (
          <div className="border-b border-line bg-surface/60 px-4 sm:px-6 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Shield className="w-4 h-4 text-accent shrink-0" />
              <Badge variant={linkedFinding.severity} size="sm">
                {linkedFinding.severity}
              </Badge>
              <Link to={`/vulnerabilities/${linkedFinding.id}`} className="text-sm text-fg hover:text-accent truncate max-w-[22rem]">
                #{linkedFinding.id} {linkedFinding.title}
              </Link>
              {linkedFinding.cve_id && <span className="text-xs font-mono text-fg-subtle">{linkedFinding.cve_id}</span>}
              {convo.pendingFinding && (
                <span className="text-[11px] text-medium">Will be linked when you send the next message</span>
              )}
              {convo.pendingFinding && !convo.findingContext && (
                <button onClick={convo.clearPendingFinding} className="p-1 rounded text-fg-subtle hover:text-fg cursor-pointer" aria-label="Remove attached finding">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex flex-wrap gap-1.5 sm:ml-auto">
                <QuickAction icon={Microscope} label="Analyze" onClick={() => void convo.send(ANALYZE_PROMPT)} disabled={convo.isSending || !!disabledReason} />
                <QuickAction
                  icon={guidanceState.loading ? Loader2 : Wrench}
                  spin={guidanceState.loading}
                  label="Remediation guidance"
                  onClick={requestGuidance}
                  disabled={guidanceState.loading}
                />
                <QuickAction icon={ClipboardCheck} label="Verification checklist" onClick={() => void convo.send(VERIFY_PROMPT)} disabled={convo.isSending || !!disabledReason} />
                <Link
                  to={`/vulnerabilities/${linkedFinding.id}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-line text-xs text-fg-muted hover:text-fg hover:bg-surface-2"
                  title="Verification is recorded with evidence on the finding page. The assistant cannot mark a finding as verified."
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Record evidence
                </Link>
              </div>
            </div>
            {guidanceState.error != null && (
              <ErrorState className="mt-2" compact error={guidanceState.error} title="Remediation guidance could not be generated" onRetry={requestGuidance} />
            )}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {notice && (
              <div role="status" className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/8 px-3 py-2 text-xs text-fg-muted">
                <span className="flex-1">{notice}</span>
                <button onClick={() => setNotice(null)} className="text-fg-subtle hover:text-fg cursor-pointer" aria-label="Dismiss">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {convo.isLoadingConversation && <LoadingState label="Loading conversation from the backend…" />}
            {convo.loadError != null && (
              <ErrorState
                error={convo.loadError}
                title="This conversation could not be loaded"
                onRetry={() => convo.conversationId && void convo.load(convo.conversationId)}
              />
            )}

            {isEmpty && (
              <WelcomeScreen
                onPrompt={(p) => void convo.send(p)}
                onAction={(kind) => (kind === 'link' ? setPickerOpen(true) : kind === 'upload' ? setImportOpen(true) : setPasteOpen(true))}
              />
            )}

            {convo.messages.map((m) => (
              <MessageItem
                key={m.id}
                message={m}
                onRetry={m.status === 'failed' ? convo.retry : undefined}
                onAskAboutImport={(text) => composerRef.current?.setText(text)}
                onAnalyzeFinding={analyzeImportedFinding}
              />
            ))}

            {convo.isSending && (
              <div className="flex items-center gap-3 text-sm text-fg-subtle" role="status" aria-live="polite">
                <span className="flex gap-1" aria-hidden="true">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                </span>
                PatchPilot is working on a response…
              </div>
            )}

            {convo.sendError && (
              <ErrorState error={convo.sendError.error} title="Your message was not sent" onRetry={convo.retry} compact />
            )}
          </div>
        </div>

        <div className="border-t border-line bg-canvas px-4 sm:px-6 pt-3 pb-3">
          <div className="max-w-3xl mx-auto">
            <Composer
              ref={composerRef}
              onSend={(t) => void convo.send(t)}
              isSending={convo.isSending}
              disabledReason={disabledReason}
              onLinkFinding={() => setPickerOpen(true)}
              onPasteFinding={() => setPasteOpen(true)}
              onUploadReport={() => setImportOpen(true)}
            />
            <p className="mt-2 text-[11px] text-fg-subtle text-center">
              {DISCLAIMER} Enter to send · Shift+Enter for a new line.
            </p>
          </div>
        </div>
      </section>

      <FindingPickerModal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleAttach} currentFindingId={linkedFinding?.id} />
      <PasteFindingModal isOpen={pasteOpen} onClose={() => setPasteOpen(false)} onSubmit={(msg) => void convo.send(msg)} />
      <ReportImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(result, fileName, format) => convo.addLocalCard({ kind: 'import-result', result, fileName, format })}
      />
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  spin,
}: {
  icon: typeof Wrench;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  spin?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-line text-xs text-fg-muted hover:text-fg hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <Icon className={`w-3.5 h-3.5 ${spin ? 'animate-spin' : ''}`} />
      {label}
    </button>
  );
}
