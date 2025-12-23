import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { CTASection } from '@/features/landing/CTASection';
import { FAQSection } from '@/features/landing/FAQSection';
import { FeaturesGrid } from '@/features/landing/FeaturesGrid';
import { HowItWorks } from '@/features/landing/HowItWorks';
import { Testimonials } from '@/features/landing/Testimonials';
import { ToolHero } from '@/features/landing/ToolHero';
import { TrustStrip } from '@/features/landing/TrustStrip';
import { Footer } from '@/templates/Footer';
import { Navbar } from '@/templates/Navbar';
import { Pricing } from '@/templates/Pricing';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Index',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const IndexPage = async (props: { params: Promise<{ locale: string }> }) => {
  const { locale } = await props.params;
  unstable_setRequestLocale(locale);

  return (
    <>
      <Navbar />

      {/* Hero with Tool Preview */}
      <ToolHero />

      {/* Trust Signals */}
      <TrustStrip />

      {/* How It Works */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      {/* Features */}
      <div id="features" className="bg-slate-50 dark:bg-slate-900/50">
        <FeaturesGrid />
      </div>

      {/* Testimonials */}
      <Testimonials />

      {/* Pricing */}
      <Pricing />

      {/* FAQ */}
      <div id="faq">
        <FAQSection />
      </div>

      {/* Final CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </>
  );
};

export default IndexPage;
