import { useTranslations } from 'next-intl';
import React from 'react';

import { cn } from '@/utils/Helpers';

export const PricingCard = (props: {
  packageId: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  savings?: string;
  popular?: boolean;
  button: React.ReactNode;
  children?: React.ReactNode;
}) => {
  const t = useTranslations('PricingPlan');

  return (
    <div
      className={cn(
        'relative rounded-xl border border-border px-6 py-8 text-center',
        props.popular && 'border-primary ring-2 ring-primary',
      )}
    >
      {props.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          {t('most_popular')}
        </div>
      )}

      <div className="text-lg font-semibold">
        {t(`${props.packageId}_package_name`, { credits: props.credits })}
      </div>

      <div className="mt-3 flex items-center justify-center">
        <div className="text-5xl font-bold">
          {`$${props.price.toFixed(2)}`}
        </div>
      </div>

      <div className="mt-2 text-sm text-muted-foreground">
        {t('price_per_credit', { price: props.pricePerCredit.toFixed(2) })}
      </div>

      {props.savings && (
        <div className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
          {props.savings}
        </div>
      )}

      {props.button}

      {props.children && (
        <ul className="mt-8 space-y-3">{props.children}</ul>
      )}
    </div>
  );
};
