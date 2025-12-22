import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { CTA } from '@/templates/CTA';
import { FAQ } from '@/templates/FAQ';
import { Features } from '@/templates/Features';
import { Footer } from '@/templates/Footer';
import { Hero } from '@/templates/Hero';
import { HowItWorks } from '@/templates/HowItWorks';
import { Navbar } from '@/templates/Navbar';
import { Pricing } from '@/templates/Pricing';
import { Testimonials } from '@/templates/Testimonials';

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
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
};

export default IndexPage;
