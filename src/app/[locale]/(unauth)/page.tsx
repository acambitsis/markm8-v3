import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { CTASection } from '@/templates/CTASection';
import { FAQSection } from '@/templates/FAQSection';
import { FeaturesGrid } from '@/templates/FeaturesGrid';
import { Footer } from '@/templates/Footer';
import { HowItWorks } from '@/templates/HowItWorks';
import { Navbar } from '@/templates/Navbar';
import { Pricing } from '@/templates/Pricing';
import { Testimonials } from '@/templates/Testimonials';
import { ToolHero } from '@/templates/ToolHero';
import { TrustStrip } from '@/templates/TrustStrip';

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
      <div id="features" className="bg-violet-50/50">
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
