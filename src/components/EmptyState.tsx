'use client';

import { motion } from 'framer-motion';
import { FileText, PenLine, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/Helpers';

type EmptyStateProps = {
  icon?: 'essays' | 'grades' | 'sparkles';
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
};

const iconMap = {
  essays: FileText,
  grades: Sparkles,
  sparkles: Sparkles,
};

export function EmptyState({
  icon = 'essays',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center',
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Animated icon container */}
      <motion.div
        className="relative mb-6"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
        {/* Icon circle */}
        <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
          <Icon className="size-10 text-primary" strokeWidth={1.5} />
        </div>
        {/* Floating sparkle */}
        <motion.div
          className="absolute -right-1 -top-1"
          animate={{ y: [-2, 2, -2], rotate: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <Sparkles className="size-5 text-primary/60" />
        </motion.div>
      </motion.div>

      {/* Text content */}
      <motion.h3
        className="text-lg font-semibold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {title}
      </motion.h3>
      <motion.p
        className="mt-2 max-w-sm text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        {description}
      </motion.p>

      {/* Action button */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Button asChild className="btn-lift mt-6 shadow-purple" size="lg">
            <Link href={action.href}>
              <PenLine className="mr-2 size-4" />
              {action.label}
            </Link>
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
