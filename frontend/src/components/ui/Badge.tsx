import type { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  /** Severity, task status, verification result or a generic tone. Case-insensitive. */
  variant?: string;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

type Tone = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'success' | 'accent' | 'neutral' | 'outline';

const toneStyles: Record<Tone, { container: string; dot: string }> = {
  critical: { container: 'bg-critical/12 text-critical border-critical/30 font-semibold', dot: 'bg-critical' },
  high: { container: 'bg-high/12 text-high border-high/30 font-semibold', dot: 'bg-high' },
  medium: { container: 'bg-medium/12 text-medium border-medium/30 font-medium', dot: 'bg-medium' },
  low: { container: 'bg-low/12 text-low border-low/30 font-medium', dot: 'bg-low' },
  info: { container: 'bg-info/12 text-info border-info/30 font-medium', dot: 'bg-info' },
  success: { container: 'bg-success/12 text-success border-success/30 font-medium', dot: 'bg-success' },
  accent: { container: 'bg-primary/12 text-accent border-primary/30 font-medium', dot: 'bg-primary' },
  neutral: { container: 'bg-surface-2 text-fg-muted border-line font-medium', dot: 'bg-fg-subtle' },
  outline: { container: 'bg-transparent text-fg-muted border-line-strong font-medium', dot: 'bg-fg-subtle' },
};

/** Maps domain values (severity, status, result) onto a colour tone. */
const variantToTone: Record<string, Tone> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
  informational: 'info',
  success: 'success',
  warning: 'medium',
  info: 'info',
  neutral: 'neutral',
  outline: 'outline',
  accent: 'accent',
  // verification results
  'verified fixed': 'success',
  'partially fixed': 'medium',
  failed: 'critical',
  inconclusive: 'accent',
  // task statuses
  open: 'low',
  'in progress': 'medium',
  in_progress: 'medium',
  blocked: 'critical',
  completed: 'success',
};

// eslint-disable-next-line react/only-export-components
export function toneFor(variant?: string): Tone {
  return variantToTone[(variant || 'neutral').toLowerCase().trim()] ?? 'neutral';
}

const sizeStyles = {
  sm: 'text-[11px] px-2 py-0.5 gap-1.5',
  md: 'text-xs px-2.5 py-1 gap-1.5',
};

export function Badge({ children, variant = 'neutral', size = 'md', dot = false, className = '' }: BadgeProps) {
  const styles = toneStyles[toneFor(variant)];
  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide uppercase font-mono whitespace-nowrap ${styles.container} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}
