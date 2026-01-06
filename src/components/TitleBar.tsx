'use client';

import { motion } from 'framer-motion';

type TitleBarProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

export function TitleBar({ title, description, action }: TitleBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mb-8 flex items-start justify-between gap-4"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
