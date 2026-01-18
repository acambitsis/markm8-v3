'use client';

import dynamic from 'next/dynamic';

import { Navbar } from '@/templates/Navbar';
import { ToolHero } from '@/templates/ToolHero';

// Below-the-fold sections - lazy loaded for performance
const TrustStrip = dynamic(() => import('@/templates/TrustStrip').then(mod => mod.TrustStrip), {
  ssr: true,
});

const HowItWorks = dynamic(() => import('@/templates/HowItWorks').then(mod => mod.HowItWorks), {
  ssr: true,
});

const FeaturesGrid = dynamic(() => import('@/templates/FeaturesGrid').then(mod => mod.FeaturesGrid), {
  ssr: true,
});

const SampleFeedback = dynamic(() => import('@/templates/SampleFeedback').then(mod => mod.SampleFeedback), {
  ssr: true,
});

const Testimonials = dynamic(() => import('@/templates/Testimonials').then(mod => mod.Testimonials), {
  ssr: true,
});

const Pricing = dynamic(() => import('@/templates/Pricing').then(mod => mod.Pricing), {
  ssr: true,
});

const FAQSection = dynamic(() => import('@/templates/FAQSection').then(mod => mod.FAQSection), {
  ssr: true,
});

const CTASection = dynamic(() => import('@/templates/CTASection').then(mod => mod.CTASection), {
  ssr: true,
});

const Footer = dynamic(() => import('@/templates/Footer').then(mod => mod.Footer), {
  ssr: true,
});

export function HomePageContent() {
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
}
