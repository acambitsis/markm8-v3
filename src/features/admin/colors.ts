import type { LucideIcon } from 'lucide-react';
import {
  CreditCard,
  FileText,
  Gift,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

/**
 * Color configuration for transaction types (credit transactions).
 * Used in transactions page and user detail page.
 */
export const transactionTypeColors: Record<string, {
  bg: string;
  text: string;
  icon: LucideIcon;
}> = {
  signup_bonus: {
    bg: 'bg-green-500/10',
    text: 'text-green-700',
    icon: Gift,
  },
  purchase: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700',
    icon: TrendingUp,
  },
  grading: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-700',
    icon: Sparkles,
  },
  refund: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-700',
    icon: RefreshCw,
  },
  admin_adjustment: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    icon: Shield,
  },
};

/**
 * Color configuration for activity types (dashboard activity feed).
 * Different from transaction types as activity uses different event types.
 */
export const activityTypeColors: Record<string, {
  bg: string;
  text: string;
  icon: LucideIcon;
}> = {
  signup: {
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    icon: Users,
  },
  purchase: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    icon: CreditCard,
  },
  essay: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    icon: FileText,
  },
};

/**
 * Get transaction type styling with fallback.
 */
export function getTransactionStyle(type: string) {
  return transactionTypeColors[type] ?? {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    icon: CreditCard,
  };
}

/**
 * Get activity type styling with fallback.
 */
export function getActivityStyle(type: string) {
  return activityTypeColors[type] ?? {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    icon: CreditCard,
  };
}
