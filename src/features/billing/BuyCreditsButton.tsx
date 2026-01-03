'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/Helpers';

type BuyCreditsButtonProps = {
  packageId: string;
  variant?: 'default' | 'outline';
  className?: string;
};

/**
 * Button that initiates Stripe Checkout for credit purchase.
 * Creates a checkout session and redirects to Stripe hosted checkout.
 */
export function BuyCreditsButton({
  packageId,
  variant = 'default',
  className,
}: BuyCreditsButtonProps) {
  const t = useTranslations('Credits');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
        setIsLoading(false);
      }
    } catch {
      // Error logged server-side in API route
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant={variant}
        className={cn('mt-6 w-full', className)}
      >
        {isLoading
          ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t('processing')}
              </>
            )
          : (
              t('buy_now')
            )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
