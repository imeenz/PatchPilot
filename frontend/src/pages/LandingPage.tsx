import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Bot,
  ClipboardCheck,
  Code2,
  FileJson,
  GaugeCircle,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  UserCheck,
  Lock,
  Eye,
} from 'lucide-react';
import { buttonSizeClasses, buttonVariantClasses } from '@/components/ui/Button';
import { LogoMark } from '@/components/brand/Logo';

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Bot,
    title: 'AI-powered security assistance',
    body: 'Ask about CVEs, CWEs, OWASP risks, authentication, network security or secure coding, and get clear, structured answers in a multi-turn conversation.',
  },
  {
    icon: Search,
    title: 'Vulnerability analysis',
    body: 'Link a finding from your workspace to a conversation to discuss its severity, root cause and impact, and to see what information is still missing.',
  },
  {
    icon: Wrench,
    title: 'Intelligent remediation guidance',
    body: 'Get step-by-step remediation, dependency upgrade advice, compatibility considerations and side effects to review before you change anything.',
  },
  {
    icon: FileJson,
    title: 'Scanner report analysis',
    body: 'Upload Trivy or OWASP ZAP JSON reports, preview every entry (valid, unsupported, invalid) and import only what you confirm.',
  },
  {
    icon: ClipboardCheck,
    title: 'Independent fix verification',
    body: 'Build verification checklists and record evidence. A finding is only marked fixed when verification evidence says so — never by the AI alone.',
  },
];

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Radar, title: 'Detect', body: 'Run your own scanners (e.g. Trivy, OWASP ZAP) and bring their JSON reports — or add findings manually.' },
  { icon: Search, title: 'Analyze', body: 'Review each finding with the assistant: what it is, why it happens and what it affects.' },
  { icon: GaugeCircle, title: 'Prioritize', body: 'Use severity and a transparent, severity-based risk score to decide what to handle first.' },
  { icon: Wrench, title: 'Remediate', body: 'Turn guidance into remediation tasks, assign owners and track their status.' },
  { icon: ShieldCheck, title: 'Verify', body: 'Collect test and scan evidence, then record the verification result against the finding.' },
];

const AUDIENCES: { icon: LucideIcon; title: string; points: string[] }[] = [
  {
    icon: Code2,
    title: 'Developers',
    points: [
      'Understand findings without leaving your workflow',
      'Concrete fix steps, code examples and upgrade paths',
      'Know how to prove a fix before closing it',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Security analysts',
    points: [
      'One place for imported findings, tasks and evidence',
      'Clear separation between "task done" and "verified fixed"',
      'Assistant answers state their uncertainty and missing information',
    ],
  },
  {
    icon: Users,
    title: 'Small teams',
    points: [
      'A lightweight remediation workflow without a large platform',
      'Shared visibility on what is open, blocked or verified',
      'Works with free, widely used open-source scanners',
    ],
  },
];

const PRINCIPLES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: UserCheck, title: 'Human in the loop', body: 'All AI and rule-based guidance is advisory and needs human review.' },
  { icon: Lock, title: 'No automatic changes', body: 'PatchPilot never modifies source code, configuration or deployments.' },
  { icon: Eye, title: 'Transparent sources', body: 'Each answer shows whether it came from the configured AI provider or the rule-based fallback.' },
];

function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-mono uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-fg">{title}</h2>
      {intro && <p className="mt-3 text-fg-muted leading-relaxed">{intro}</p>}
    </div>
  );
}

/** Illustrative product visual. Shows the shape of an answer, not real data or statistics. */
function HeroVisual() {
  return (
    <div className="relative" aria-label="Illustration of a PatchPilot assistant conversation" role="img">
      <div className="absolute -inset-6 rounded-[2rem] bg-primary/10 blur-2xl" aria-hidden="true" />
      <div className="relative rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface-2/60">
          <div className="flex items-center gap-2">
            <LogoMark className="w-6 h-6" />
            <span className="text-sm font-medium text-fg">PatchPilot AI</span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle">Illustrative example</span>
        </div>
        <div className="p-4 sm:p-5 space-y-4 text-sm">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-on-primary px-4 py-2.5">
            Our search endpoint concatenates the query string into SQL. How should we fix it?
          </div>
          <div className="max-w-[92%] rounded-2xl rounded-tl-sm border border-line bg-surface-2/60 px-4 py-3 space-y-3">
            {[
              ['Root cause', 'User input is interpreted as part of the SQL statement.'],
              ['Remediation', 'Use parameterised queries or the ORM query builder.'],
              ['Verification', 'Add a regression test with injection payloads, then re-scan.'],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[11px] font-mono uppercase tracking-wider text-accent">{k}</p>
                <p className="text-fg-muted">{v}</p>
              </div>
            ))}
            <pre className="rounded-lg bg-code text-code-fg text-xs font-mono p-3 overflow-x-auto">
              <span className="tok-keyword">cursor</span>.execute(<span className="tok-string">"SELECT * FROM products WHERE name = %s"</span>, (q,))
            </pre>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Detect', 'Analyze', 'Prioritize', 'Remediate', 'Verify'].map((s, i) => (
              <span key={s} className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded-md border border-line text-fg-subtle">
                <span className="text-accent">{i + 1}</span>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(var(--pp-line) 1px, transparent 1px), linear-gradient(90deg, var(--pp-line) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 30% 20%, black 20%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="w-3.5 h-3.5" />
              Intelligent Security Remediation Assistant
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold tracking-tight leading-[1.08] text-fg">
              Understand vulnerabilities. Prioritize risks.{' '}
              <span className="text-accent">Remediate with confidence.</span>
            </h1>
            <p className="mt-6 text-lg text-fg-muted leading-relaxed max-w-xl">
              PatchPilot turns scanner findings into clear explanations, actionable remediation plans and verifiable
              fixes, with an AI assistant that shows its sources and states what it does not know.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/overview" className={`inline-flex items-center ${buttonSizeClasses.lg} ${buttonVariantClasses.primary}`}>
                Explore Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/assistant" className={`inline-flex items-center ${buttonSizeClasses.lg} ${buttonVariantClasses.secondary}`}>
                <Bot className="w-4 h-4" />
                Meet PatchPilot AI
              </Link>
            </div>
            <p className="mt-5 text-xs text-fg-subtle">
              No sign-up. The workspace starts empty; import a scanner report or add findings to begin.
            </p>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-line bg-canvas-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <SectionHeading
            eyebrow="Features"
            title="Five capabilities, one remediation workflow"
            intro="Everything centres on the assistant, backed by a workspace that keeps findings, tasks and evidence together."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <article
                key={title}
                className={`rounded-xl border border-line bg-surface p-6 shadow-card ${i === 0 ? 'lg:row-span-2 flex flex-col' : ''}`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/12 border border-primary/25 text-accent flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 font-semibold text-fg">{title}</h3>
                <p className="mt-2 text-sm text-fg-muted leading-relaxed">{body}</p>
                {i === 0 && (
                  <div className="mt-6 lg:mt-auto pt-4 border-t border-line space-y-2">
                    {['Explain CVE vs CWE', 'How does XSS differ from CSRF?', 'Review our JWT validation approach'].map((q) => (
                      <p key={q} className="text-xs font-mono text-fg-subtle flex items-center gap-2">
                        <span className="text-accent">›</span> {q}
                      </p>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <SectionHeading
            eyebrow="How it works"
            title="Detect → Analyze → Prioritize → Remediate → Verify"
            intro="PatchPilot works with the findings you bring in. It does not scan your repositories or infrastructure itself; your scanners stay in charge of detection."
          />
          <ol className="mt-12 grid gap-4 md:grid-cols-5">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="relative rounded-xl border border-line bg-surface p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-surface-2 border border-line text-accent flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-xs font-mono text-fg-subtle">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold text-fg">{title}</h3>
                <p className="mt-1.5 text-sm text-fg-muted leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-line bg-canvas-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <SectionHeading eyebrow="Who it helps" title="Built for the people who actually fix things" />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {AUDIENCES.map(({ icon: Icon, title, points }) => (
              <article key={title} className="rounded-xl border border-line bg-surface p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-fg">{title}</h3>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm text-fg-muted leading-relaxed">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="scroll-mt-20 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12">
          <div>
            <SectionHeading
              eyebrow="About"
              title="An assistant that is honest about its limits"
              intro="PatchPilot is an academic project from the TrustChain team: a React frontend and a FastAPI backend that store findings, remediation tasks, verification evidence and assistant conversations."
            />
            <p className="mt-4 text-fg-muted leading-relaxed">
              When an AI provider is configured, the assistant uses it; otherwise a deterministic rule-based fallback
              answers, and the interface says which one did. Answers are guidance, not guarantees.
            </p>
          </div>
          <div className="grid gap-3">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-xl border border-line bg-surface p-5 shadow-card">
                <Icon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-fg">{title}</h3>
                  <p className="mt-1 text-sm text-fg-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line bg-canvas-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-fg">Start with an empty, honest workspace</h2>
            <p className="mt-2 text-fg-muted">Import a Trivy or OWASP ZAP report, or just ask the assistant a question.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/assistant" className={`inline-flex items-center ${buttonSizeClasses.lg} ${buttonVariantClasses.primary}`}>
              Open AI Assistant
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/overview" className={`inline-flex items-center ${buttonSizeClasses.lg} ${buttonVariantClasses.secondary}`}>
              Go to workspace
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
