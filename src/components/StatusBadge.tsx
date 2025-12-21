import { Badge } from '@/components/ui/badge';

type StatusBadgeProps = {
  status: 'queued' | 'processing' | 'complete' | 'failed' | string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'complete':
      return <Badge variant="default">Complete</Badge>;
    case 'processing':
      return <Badge variant="secondary">Processing</Badge>;
    case 'queued':
      return <Badge variant="outline">Queued</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return null;
  }
}
