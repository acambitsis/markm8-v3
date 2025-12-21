import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { PricingInformation } from '@/features/billing/PricingInformation';
import { Section } from '@/features/landing/Section';
import { CREDIT_PACKAGE_ID } from '@/utils/AppConfig';

export const Pricing = () => {
  const t = useTranslations('Pricing');

  // Create button for each credit package
  const buttonList = Object.values(CREDIT_PACKAGE_ID).reduce(
    (acc, packageId) => {
      acc[packageId] = (
        <Link
          className={buttonVariants({
            size: 'sm',
            className: 'mt-5 w-full',
          })}
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
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <PricingInformation buttonList={buttonList} />
    </Section>
  );
};
