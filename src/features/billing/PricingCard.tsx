'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

import { cn } from '@/utils/Helpers';

type PackageId = 'single' | 'starter' | 'standard' | 'bulk' | 'mega';

export const PricingCard = (props: {
  packageId: PackageId;
  credits: number;
  price: number;
  pricePerCredit: number;
  savings?: string;
  popular?: boolean;
  button: React.ReactNode;
  children?: React.ReactNode;
  index?: number;
}) => {
  const t = useTranslations('PricingPlan');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: (props.index ?? 0) * 0.1,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'relative rounded-2xl border bg-card px-6 py-8 text-center',
        'transition-shadow duration-300',
        'hover:shadow-lg',
        props.popular && 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10',
      )}
    >
      {props.popular && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-md"
        >
          <Sparkles className="size-3" />
          {t('most_popular')}
        </motion.div>
      )}

      <div className="text-lg font-semibold">
        {t(`${props.packageId}_package_name`, { credits: props.credits })}
      </div>

      <div className="mt-4 flex items-baseline justify-center gap-1">
        <span className="text-4xl font-bold tracking-tight">
          $
          {props.price.toFixed(0)}
        </span>
        {props.price % 1 !== 0 && (
          <span className="text-2xl font-semibold text-muted-foreground">
            .
            {(props.price % 1).toFixed(2).slice(2)}
          </span>
        )}
      </div>

      <div className="mt-2 text-sm text-muted-foreground">
        {t('price_per_credit', { price: props.pricePerCredit.toFixed(2) })}
      </div>

      {props.savings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success"
        >
          {props.savings}
        </motion.div>
      )}

      <div className="mt-6">
        {props.button}
      </div>

      {props.children && (
        <ul className="mt-8 space-y-3">{props.children}</ul>
      )}
    </motion.div>
  );
};
