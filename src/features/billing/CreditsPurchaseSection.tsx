'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BuyCreditsButton } from '@/features/billing/BuyCreditsButton';
import { PricingInformation } from '@/features/billing/PricingInformation';
import { getAllCreditPackages } from '@/utils/AppConfig';

/**
 * Section for purchasing credits.
 * Shows success/cancel alerts based on query params from Stripe redirect.
 * Renders pricing cards with buy buttons.
 */
export function CreditsPurchaseSection() {
  const t = useTranslations('Credits');
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const canceled = searchParams.get('canceled') === 'true';

  // Build button map for PricingInformation
  const packages = getAllCreditPackages();
  const buttonList = Object.fromEntries(
    packages.map(pkg => [
      pkg.id,
      <BuyCreditsButton key={pkg.id} packageId={pkg.id} />,
    ]),
  );

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="border-primary/20 bg-primary/10">
          <CheckCircle2 className="size-4 text-primary" />
          <AlertTitle>{t('payment_success_title')}</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {t('payment_success_description')}
          </AlertDescription>
        </Alert>
      )}

      {canceled && (
        <Alert className="border-border bg-muted">
          <XCircle className="size-4 text-muted-foreground" />
          <AlertTitle>{t('payment_canceled_title')}</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {t('payment_canceled_description')}
          </AlertDescription>
        </Alert>
      )}

      <PricingInformation buttonList={buttonList} />
    </div>
  );
}
