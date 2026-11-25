import { useState } from 'react';
import {
  Sparkles,
  Bot,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import type { RemediationGuidanceResponse } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface RemediationGuidanceCardProps {
  guidance: RemediationGuidanceResponse | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

export function RemediationGuidanceCard({
  guidance,
  isLoading,
  error,
  onGenerate,
}: RemediationGuidanceCardProps) {
  const [activeTab, setActiveTab] = useState<'remediation' | 'verification' | 'impact'>('remediation');

  if (!guidance && !isLoading && !error) {
    return (
      <Card className="border border-primary/30 bg-primary/10 p-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-accent flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-fg">
          AI Remediation Guidance Ready to Synthesize
        </h3>
        <p className="text-xs text-fg-subtle max-w-md mx-auto mt-1 mb-4">
          Click below to request automated remediation steps, compatibility caveats, and
          verification criteria generated specifically for this vulnerability finding.
        </p>
        <Button
          variant="primary"
          onClick={onGenerate}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          Generate Remediation Guidance
        </Button>
      </Card>
    );
  }

  return (
    <Card className="border border-line shadow-card">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-accent border border-primary/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-fg tracking-tight">
                Remediation Guidance
              </h3>
              {guidance && (
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                    guidance.is_fallback
                      ? 'bg-medium/10 text-medium border-medium/30'
                      : 'bg-success/10 text-success border-success/30'
                  }`}
                >
                  {guidance.is_fallback
                    ? `Deterministic Fallback (${guidance.provider})`
                    : `LLM Provider (${guidance.provider}${
                        guidance.model ? `: ${guidance.model}` : ''
                      })`}
                </span>
              )}
            </div>
            <p className="text-[11px] text-fg-subtle font-mono">
              Synthesized via POST /api/v1/findings/{'{id}'}/remediation-guidance
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onGenerate}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5 text-fg-subtle" />}
        >
          Regenerate
        </Button>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-critical/10 border border-critical/30 text-xs text-critical flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-critical shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={onGenerate}>
              Retry
            </Button>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-fg-muted font-medium">
              Generating contextual remediation advice and verification checklist...
            </p>
          </div>
        )}

        {guidance && !isLoading && (
          <>
            {/* Human-review Disclaimer */}
            <div className="p-3 rounded-lg bg-medium/10 border border-medium/30 text-xs text-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-medium shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold">Safety Requirement:</span>
                <p>{guidance.disclaimer}</p>
              </div>
            </div>

            {/* Explanation Block */}
            <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-1.5">
              <h4 className="text-xs font-semibold text-fg uppercase tracking-wider flex items-center gap-1.5">
                <span>Vulnerability Explanation</span>
              </h4>
              <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                {guidance.vulnerability_explanation}
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-line pb-1 text-xs">
              <button
                onClick={() => setActiveTab('remediation')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'remediation'
                    ? 'bg-primary text-white shadow-card'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-2'
                }`}
              >
                Recommended Steps ({guidance.recommended_remediation_steps.length})
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'verification'
                    ? 'bg-primary text-white shadow-card'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-2'
                }`}
              >
                Verification Steps ({guidance.verification_steps.length})
              </button>
              <button
                onClick={() => setActiveTab('impact')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'impact'
                    ? 'bg-primary text-white shadow-card'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-2'
                }`}
              >
                Impact & Caveats
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'remediation' && (
              <div className="space-y-2.5">
                <ol className="space-y-2 text-xs sm:text-sm text-fg">
                  {guidance.recommended_remediation_steps.map((step, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-lg bg-surface border border-line flex items-start gap-3 shadow-card"
                    >
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-accent font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>

                {guidance.compatibility_considerations && (
                  <div className="p-3 rounded-lg bg-surface-2 border border-line text-xs text-fg-muted flex items-start gap-2">
                    <ListChecks className="w-4 h-4 text-fg-subtle shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-fg">
                        Compatibility Considerations:
                      </span>{' '}
                      {guidance.compatibility_considerations}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="space-y-2.5">
                <ul className="space-y-2 text-xs sm:text-sm text-fg">
                  {guidance.verification_steps.map((step, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-lg bg-success/10 border border-success/30 flex items-start gap-3 shadow-card"
                    >
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span className="leading-relaxed text-fg">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'impact' && (
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-lg bg-surface-2 border border-line space-y-1">
                  <span className="font-semibold text-fg block">
                    Potential Impact if Exploited:
                  </span>
                  <p className="text-fg-muted leading-relaxed">
                    {guidance.potential_impact}
                  </p>
                </div>

                {guidance.uncertainty_or_missing_information && (
                  <div className="p-3 rounded-lg bg-surface-2 border border-line flex items-start gap-2 text-fg-muted">
                    <HelpCircle className="w-4 h-4 text-fg-subtle shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-fg-muted">
                        Model Notes & Uncertainty:
                      </span>{' '}
                      {guidance.uncertainty_or_missing_information}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
