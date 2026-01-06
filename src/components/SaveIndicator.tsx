'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Cloud, CloudOff, Loader2 } from 'lucide-react';

import { cn } from '@/utils/Helpers';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type SaveIndicatorProps = {
  status: SaveStatus;
  className?: string;
};

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Cloud className="size-4" />
            <span>Draft</span>
          </motion.div>
        )}

        {status === 'saving' && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" />
            <span>Saving...</span>
          </motion.div>
        )}

        {status === 'saved' && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 text-sm text-green-600"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 15 }}
            >
              <Check className="size-4" />
            </motion.div>
            <span>Saved</span>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 text-sm text-destructive"
          >
            <CloudOff className="size-4" />
            <span>Save failed</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
