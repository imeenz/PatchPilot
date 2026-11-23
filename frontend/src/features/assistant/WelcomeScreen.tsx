import type { LucideIcon } from 'lucide-react';
import { BookOpen, ClipboardCheck, FileJson, Search, Wrench } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';

interface Capability {
  icon: LucideIcon;
  title: string;
  prompts: string[];
  action?: { label: string; kind: 'link' | 'paste' | 'upload' };
}

const CAPABILITIES: Capability[] = [
  {
    icon: BookOpen,
    title: 'Security questions',
    prompts: [
      'What is the difference between a CVE and a CWE?',
      'Explain the OWASP Top 10 risk "Broken Access Control" with examples.',
      'How do I prevent SQL injection in a Python web API?',
    ],
  },
  {
    icon: Search,
    title: 'Vulnerability analyst',
    prompts: ['How should I judge the real severity of a finding in my environment?'],
    action: { label: 'Attach a finding from the workspace', kind: 'link' },
  },
  {
    icon: Wrench,
    title: 'Remediation advisor',
    prompts: [
      'How do I safely upgrade a vulnerable dependency without breaking my app?',
      'Show a secure example of storing passwords in Python.',
    ],
  },
  {
    icon: FileJson,
    title: 'Scanner reports',
    prompts: ['What is the difference between Trivy and OWASP ZAP findings?'],
    action: { label: 'Upload a Trivy or ZAP JSON report', kind: 'upload' },
  },
  {
    icon: ClipboardCheck,
    title: 'Verification assistant',
    prompts: [
      'What tests should I run to prove an XSS fix works?',
      'What scanner evidence should I collect to show a dependency vulnerability is fixed?',
    ],
  },
];

interface Props {
  onPrompt: (text: string) => void;
  onAction: (kind: 'link' | 'paste' | 'upload') => void;
}

export function WelcomeScreen({ onPrompt, onAction }: Props) {
  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12">
      <div className="text-center">
        <LogoMark className="w-12 h-12 mx-auto" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-fg">How can PatchPilot help?</h1>
        <p className="mt-2 text-sm text-fg-muted max-w-xl mx-auto">
          Ask a security question, analyse a finding, plan a fix or work out how to verify it. Answers are guidance for
          human review. PatchPilot never changes your code or marks issues as fixed by itself.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {CAPABILITIES.map(({ icon: Icon, title, prompts, action }) => (
          <section key={title} className="rounded-xl border border-line bg-surface p-4 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Icon className="w-4 h-4 text-accent" />
              {title}
            </h2>
            <ul className="mt-3 space-y-1.5">
              {prompts.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => onPrompt(p)}
                    className="w-full text-left text-[13px] text-fg-muted hover:text-fg rounded-md px-2 py-1.5 -mx-2 hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    {p}
                  </button>
                </li>
              ))}
              {action && (
                <li>
                  <button
                    type="button"
                    onClick={() => onAction(action.kind)}
                    className="w-full text-left text-[13px] font-medium text-accent rounded-md px-2 py-1.5 -mx-2 hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    {action.label} →
                  </button>
                </li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
