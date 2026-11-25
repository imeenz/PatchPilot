import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  badge?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, badge, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-line-strong rounded-xl bg-surface/60 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/12 border border-primary/25 flex items-center justify-center text-accent mb-4">
        <Icon className="w-6 h-6" />
      </div>
      {badge && (
        <span className="text-[11px] font-mono uppercase tracking-wider text-accent bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full mb-2">
          {badge}
        </span>
      )}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      <p className="text-sm text-fg-subtle max-w-md mt-1.5 leading-relaxed">{description}</p>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
