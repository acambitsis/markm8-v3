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
import { AllLocales } from '@/utils/AppConfig';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Index',
  });

  // Build locale alternates for hreflang tags
  const languages: Record<string, string> = {};
  for (const loc of AllLocales) {
    languages[loc] = loc === 'en' ? '/' : `/${loc}`;
  }

  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: {
      canonical: locale === 'en' ? '/' : `/${locale}`,
      languages,
    },
    openGraph: {
      title: t('meta_title'),
      description: t('meta_description'),
      locale: locale === 'en' ? 'en_US' : 'fr_FR',
      alternateLocale: locale === 'en' ? ['fr_FR'] : ['en_US'],
    },
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
