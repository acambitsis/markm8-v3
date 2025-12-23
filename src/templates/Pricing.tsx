import { Check } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { PricingInformation } from '@/features/billing/PricingInformation';
import { Section } from '@/features/landing/Section';
import { CREDIT_PACKAGE_ID } from '@/utils/AppConfig';
import { cn } from '@/utils/Helpers';

export const Pricing = () => {
  const t = useTranslations('Pricing');

  // Create button for each credit package
  const buttonList = Object.values(CREDIT_PACKAGE_ID).reduce(
    (acc, packageId) => {
      acc[packageId] = (
        <Link
          className={cn(
            buttonVariants({
              size: 'sm',
              className: 'mt-5 w-full',
            }),
            'bg-violet-500 hover:bg-violet-600',
          )}
          href="/sign-up"
        >
          {t('button_text')}
        </Link>
      );
      return acc;
    },
    {} as Record<string, React.ReactNode>,
  );

  return (
    <div id="pricing">
      <Section
        subtitle={t('section_subtitle')}
        title={t('section_title')}
        description={t('section_description')}
      >
        <PricingInformation buttonList={buttonList} />

        {/* Benefits list */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            <span>Credits never expire</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            <span>Instant delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            <span>Secure payment via Stripe</span>
          </div>
        </div>
      </Section>
    </div>
  );
};
