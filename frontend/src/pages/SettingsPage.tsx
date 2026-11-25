import { CheckCircle2, FlaskConical, Monitor, Moon, RefreshCw, Server, ShieldCheck, Sun } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { API_BASE_URL } from '@/services/api';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/ThemeProvider';

const ENDPOINTS: { method: string; path: string; desc: string }[] = [
  { method: 'GET', path: '/api/v1/health', desc: 'Backend, database and AI provider status' },
  { method: 'GET', path: '/api/v1/dashboard/summary', desc: 'Workspace metrics (Overview)' },
  { method: 'POST', path: '/api/v1/findings/import', desc: 'Import scanner findings / add a finding' },
  { method: 'GET', path: '/api/v1/findings', desc: 'List findings with search, filters and pagination' },
  { method: 'GET', path: '/api/v1/findings/{id}', desc: 'Finding details with tasks and evidence' },
  { method: 'POST', path: '/api/v1/findings/{id}/remediation-guidance', desc: 'AI or rule-based remediation guidance' },
  { method: 'POST', path: '/api/v1/findings/{id}/tasks', desc: 'Create a remediation task' },
  { method: 'GET', path: '/api/v1/tasks', desc: 'List remediation tasks' },
  { method: 'PATCH', path: '/api/v1/tasks/{id}', desc: 'Update a remediation task' },
  { method: 'POST', path: '/api/v1/findings/{id}/verification', desc: 'Record verification evidence' },
  { method: 'GET', path: '/api/v1/findings/{id}/verification', desc: 'Verification history for a finding' },
  { method: 'POST', path: '/api/v1/chat', desc: 'Send a message (creates or continues a conversation)' },
  { method: 'GET', path: '/api/v1/chat/conversations/{id}', desc: 'Load a saved conversation' },
];

const METHOD_TONE: Record<string, string> = { GET: 'low', POST: 'success', PATCH: 'medium' };

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { status, health, recheck } = useBackendHealth();
  const demo = useDemoMode();

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Settings</h1>
        <p className="text-sm text-fg-subtle mt-0.5">Appearance, backend connection and workspace data mode.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-fg-muted" />
            <h2 className="text-sm font-semibold text-fg">Appearance</h2>
          </div>
        </CardHeader>
        <CardBody>
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-3 max-w-md">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                role="radio"
                aria-checked={theme === value}
                onClick={() => setTheme(value)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                  theme === value ? 'border-primary bg-primary/10' : 'border-line hover:bg-surface-2'
                }`}
              >
                <Icon className={`w-5 h-5 ${theme === value ? 'text-accent' : 'text-fg-subtle'}`} />
                <span className="text-sm font-medium text-fg">{label}</span>
                {theme === value && <CheckCircle2 className="w-4 h-4 text-accent ml-auto" />}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-fg-subtle">Your choice is saved in this browser and also applies to the public site.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-fg-muted" />
            <h2 className="text-sm font-semibold text-fg">Backend connection</h2>
          </div>
          <Button variant="secondary" size="sm" onClick={recheck} isLoading={status === 'checking'} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Check again
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          <dl className="divide-y divide-line text-sm">
            {[
              ['API base URL', <code key="u" className="font-mono text-xs text-accent break-all">{API_BASE_URL}</code>],
              ['Configured by', <code key="c" className="font-mono text-xs text-fg-muted">VITE_API_BASE_URL</code>],
              [
                'Status',
                <Badge key="s" variant={status === 'online' ? 'success' : status === 'offline' ? 'critical' : 'medium'} size="sm" dot>
                  {status}
                </Badge>,
              ],
              ['Database', <span key="d" className="text-fg-muted">{health?.database ?? 'unknown'}</span>],
              [
                'AI configuration',
                <span key="a" className="font-mono text-xs text-fg-muted">
                  {health?.ai_provider ?? 'unknown'}
                  {health?.ai_configuration?.status === 'configured_unverified' && ' — credentials are configured; provider reachability is checked only during a response'}
                  {health?.ai_configuration?.status === 'rule-based-fallback' && ' — using deterministic rule-based fallback; no live provider is configured'}
                </span>,
              ],
              ['Backend version', <span key="v" className="text-fg-muted">{health ? `${health.app} ${health.version}` : 'unknown'}</span>],
            ].map(([k, v]) => (
              <div key={k as string} className="grid sm:grid-cols-3 gap-1 px-5 py-3">
                <dt className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">{k}</dt>
                <dd className="sm:col-span-2">{v}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-fg-muted" />
            <h2 className="text-sm font-semibold text-fg">Workspace data</h2>
          </div>
          <Badge variant={demo.isActive ? 'medium' : 'success'} size="sm">
            {demo.isActive ? 'Demo dataset' : 'Live backend'}
          </Badge>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-fg-muted leading-relaxed">
            By default the workspace shows only real records from the backend, and starts empty. For presentations you
            can switch to a labelled demo dataset. It is held in memory in this tab only, is never written to the
            backend, and is cleared when you exit demo mode or reload the page. Remediation guidance, chat context
            and imports are unavailable for demo records.
          </p>
          {demo.isActive ? (
            <Button variant="secondary" onClick={demo.disable}>
              Exit demo, return to live workspace
            </Button>
          ) : (
            <Button variant="outline" onClick={demo.enable} leftIcon={<FlaskConical className="w-4 h-4" />}>
              Load demo dataset
            </Button>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-success" />
            <h2 className="text-sm font-semibold text-fg">Backend endpoints used by this frontend</h2>
          </div>
          <span className="text-xs font-mono text-fg-subtle">{ENDPOINTS.length}</span>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-2 text-[11px] font-semibold text-fg-subtle uppercase tracking-wider">
                <th className="px-4 py-2.5">Method</th>
                <th className="px-4 py-2.5">Endpoint</th>
                <th className="px-4 py-2.5">Used for</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ENDPOINTS.map((ep) => (
                <tr key={`${ep.method}-${ep.path}`}>
                  <td className="px-4 py-2.5">
                    <Badge variant={METHOD_TONE[ep.method]} size="sm">
                      {ep.method}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-fg whitespace-nowrap">{ep.path}</td>
                  <td className="px-4 py-2.5 text-fg-muted">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex items-start gap-3 text-sm">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-fg">Human review and independent verification</p>
            <p className="text-fg-muted leading-relaxed">
              AI and rule-based guidance requires human review. Completing a task does not mean a vulnerability is fixed:
              a finding is only shown as verified when evidence is recorded with the result &quot;Verified Fixed&quot;.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
