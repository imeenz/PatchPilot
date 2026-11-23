import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

type Tone = 'accent' | 'critical' | 'medium' | 'success';

const TONES: Record<Tone, string> = {
  accent: 'text-accent bg-primary/12 border-primary/25',
  critical: 'text-critical bg-critical/12 border-critical/25',
  medium: 'text-medium bg-medium/12 border-medium/25',
  success: 'text-success bg-success/12 border-success/25',
};

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  tone?: Tone;
}

export function MetricCard({ title, value, icon: Icon, description, tone = 'accent' }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">{title}</p>
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">{value}</p>
          {description && <p className="text-xs text-fg-subtle pt-0.5">{description}</p>}
        </div>
        <div className={`p-2.5 rounded-xl border shrink-0 ${TONES[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
