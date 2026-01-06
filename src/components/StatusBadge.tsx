import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';

import { cn } from '@/utils/Helpers';

type StatusBadgeProps = {
  status: 'queued' | 'processing' | 'complete' | 'failed' | string;
  showIcon?: boolean;
};

const statusConfig = {
  complete: {
    label: 'Complete',
    icon: CheckCircle2,
    className: 'bg-success/10 text-success border-success/20',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    className: 'bg-primary/10 text-primary border-primary/20',
    iconClassName: 'animate-spin',
  },
  queued: {
    label: 'Queued',
    icon: Clock,
    className: 'bg-muted text-muted-foreground border-border',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
} as const;

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig];

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'text-xs font-medium',
        'transition-colors duration-200',
        config.className,
      )}
    >
      {showIcon && (
        <Icon className={cn(
          'size-3',
          'iconClassName' in config && config.iconClassName,
        )}
        />
      )}
      {config.label}
    </span>
  );
}
