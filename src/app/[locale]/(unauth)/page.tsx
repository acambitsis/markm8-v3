import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { CTASection } from '@/templates/CTASection';
import { FAQSection } from '@/templates/FAQSection';
import { FeaturesGrid } from '@/templates/FeaturesGrid';
import { Footer } from '@/templates/Footer';
import { HowItWorks } from '@/templates/HowItWorks';
import { Navbar } from '@/templates/Navbar';
import { Pricing } from '@/templates/Pricing';
import { SampleFeedback } from '@/templates/SampleFeedback';
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
    <div className="relative overflow-x-hidden">
      {/* Navigation */}
      <Navbar />

      {/* Hero with Tool Preview - Full viewport height */}
      <ToolHero />

      {/* Trust Signals */}
      <TrustStrip />

      {/* How It Works */}
      <section id="how-it-works">
        <HowItWorks />
      </section>

      {/* Features - Bento Grid */}
      <section id="features">
        <FeaturesGrid />
      </section>

      {/* Sample Feedback Showcase */}
      <section id="sample-feedback">
        <SampleFeedback />
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Pricing */}
      <Pricing />

      {/* FAQ */}
      <section id="faq">
        <FAQSection />
      </section>

      {/* Final CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default IndexPage;
