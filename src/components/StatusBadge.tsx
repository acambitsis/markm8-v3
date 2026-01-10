import { Badge, type BadgeProps } from '@/components/ui/badge';

type Props = {
  status: 'queued' | 'processing' | 'complete' | 'failed' | string;
};

const STATUS_CONFIG: Record<string, { variant: BadgeProps['variant']; label: string }> = {
  complete: { variant: 'default', label: 'Complete' },
  processing: { variant: 'secondary', label: 'Processing' },
  queued: { variant: 'outline', label: 'Queued' },
  failed: { variant: 'destructive', label: 'Failed' },
};

export function StatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status];
  if (!config) {
    return null;
  }
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
