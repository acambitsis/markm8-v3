import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Privacy Policy | MarkM8',
  description: 'Learn how MarkM8 collects, uses, and protects your personal data in compliance with UK GDPR.',
};

export default async function PrivacyPolicy(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  unstable_setRequestLocale(locale);

  const lastUpdated = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-violet-50">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-lg md:p-12">
          <h1 className="mb-2 text-4xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="mb-8 text-sm text-slate-600">
            Last Updated:
            {' '}
            {lastUpdated}
          </p>

          {/* Quick Student Summary */}
          <div className="mb-8 rounded-lg border border-violet-200 bg-violet-50 p-6">
            <h2 className="mb-3 text-lg font-semibold text-violet-900">Quick Summary for Students</h2>
            <ul className="space-y-2 text-violet-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>We respect your privacy and protect your data.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>We only use your data to help you improve your writing and run our service.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You&apos;re always in control—contact us to access or delete your data.</span>
              </li>
            </ul>
          </div>

          <div className="prose prose-slate max-w-none">
            {/* 1. Introduction */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">1. Introduction</h2>
              <p className="mb-4 text-slate-700">
                Welcome to
                {' '}
                <strong>MarkM8</strong>
                {' '}
                (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). Your privacy is of paramount importance to us.
                This Privacy Policy explains how we collect, use, store, and protect your personal data when you use
                our website and services (collectively, the &quot;Platform&quot;). MarkM8 is committed to safeguarding your
                information in accordance with the UK General Data Protection Regulation (&quot;UK GDPR&quot;), the Data
                Protection Act 2018, and other applicable data protection laws.
              </p>
              <p className="text-slate-700">
                By using our Platform, you agree to the terms of this Privacy Policy. If you do not agree,
                please do not use our services.
              </p>
            </section>

            {/* 2. Data Controller */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">2. Data Controller</h2>
              <p className="mb-2 text-slate-700">
                MarkM8 is the data controller responsible for your personal data.
              </p>
              <p className="text-slate-700">
                <strong>Contact:</strong>
                {' '}
                support@markm8.com
                <br />
                <strong>Address:</strong>
                {' '}
                London, United Kingdom
              </p>
            </section>

            {/* 3. What Data We Collect */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">3. What Data We Collect</h2>
              <p className="mb-4 text-slate-700">We collect and process the following categories of data:</p>
              <ul className="list-disc space-y-2 pl-6 text-slate-700">
                <li>
                  <strong>Personal Identification Data:</strong>
                  {' '}
                  Name, email address, institution/university (optional), profile photo (optional). We may also collect country of residence where relevant.
                </li>
                <li>
                  <strong>Account Data:</strong>
                  {' '}
                  Username, authentication method, login history, session data.
                </li>
                <li>
                  <strong>Academic Data:</strong>
                  {' '}
                  Essay submissions, assignment instructions, grades, feedback, writing samples.
                </li>
                <li>
                  <strong>Transactional Data:</strong>
                  {' '}
                  Payment details (processed securely via Stripe), purchase history, credit balance, and related Stripe customer reference/tokens.
                </li>
                <li>
                  <strong>Technical Data:</strong>
                  {' '}
                  IP address, browser type, device information, usage data, cookies and similar tracking technologies.
                </li>
                <li>
                  <strong>Communications Data:</strong>
                  {' '}
                  Support queries, feedback, survey responses, messages sent via the Platform.
                </li>
              </ul>
              <div className="mt-4 rounded-lg bg-blue-50 p-4">
                <p className="text-slate-700">
                  <strong>Special Category Data:</strong>
                  {' '}
                  We do not require or intentionally collect &quot;special category&quot;
                  data (e.g., ethnicity, health, political views) except where explicitly provided for accessibility
                  or support reasons (e.g., ADHD, dyslexia), and only with your explicit consent.
                </p>
              </div>
            </section>

            {/* 4. How We Use Your Data */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">4. How We Use Your Data</h2>
              <p className="mb-4 text-slate-700">
                We process your data only where we have a lawful basis.
                {' '}
                <strong>Main purposes include:</strong>
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-700">
                <li>Providing, personalizing, and improving our Platform and services.</li>
                <li>Authenticating your identity and securing your account.</li>
                <li>Delivering AI-generated assignment feedback and grades.</li>
                <li>Processing payments and managing credits.</li>
                <li>Communicating important updates, support, or service notifications.</li>
                <li>Research, analytics, and service development (using anonymized or aggregated data). Any analytics we conduct are solely to improve the Platform and will never be used in ways that prejudice your personal data or privacy.</li>
                <li>Complying with legal obligations (including fraud prevention and academic integrity).</li>
                <li>Enforcing our Terms of Use and protecting the integrity of our Platform.</li>
              </ul>
              <div className="rounded-lg bg-violet-50 p-4">
                <p className="text-slate-700">
                  <strong>AI Processing & Model Improvement:</strong>
                  {' '}
                  Our Platform uses artificial intelligence to
                  generate assignment feedback and grade predictions. Your essay submissions may also be used, in
                  an anonymized and aggregated form, to improve our AI models. We will always seek your explicit
                  consent before using your data for this purpose beyond providing your requested feedback.
                </p>
              </div>
            </section>

            {/* 5. Identity Provider */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">5. Identity Provider</h2>
              <p className="text-slate-700">
                We use
                {' '}
                <strong>Clerk</strong>
                {' '}
                as our identity provider for user authentication. When you sign in,
                your name and email address are collected with your consent.
                For more details, please refer to
                {' '}
                <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline hover:text-violet-700">
                  Clerk&apos;s Privacy Policy
                </a>
                .
              </p>
            </section>

            {/* 6. Payment Processing */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">6. Payment Processing</h2>
              <p className="mb-4 text-slate-700">
                We use
                {' '}
                <strong>Stripe</strong>
                {' '}
                to process payments securely. When you make a payment, your payment
                information (such as credit/debit card number, billing address, and other relevant data) is
                transmitted directly to Stripe.
                {' '}
                <strong>We do not store your full card details on our servers.</strong>
              </p>
              <p className="text-slate-700">
                Stripe processes your data in accordance with their own Privacy Policy, which you can review
                {' '}
                <a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline hover:text-violet-700">
                  here
                </a>
                .
                Stripe may transfer data outside the UK/EEA, but will ensure appropriate safeguards are in place,
                such as Standard Contractual Clauses or UK International Data Transfer Agreements.
              </p>
            </section>

            {/* 7. AI Sub-Processing */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">7. AI Sub-Processing</h2>
              <p className="mb-4 text-slate-700">
                We use AI providers via OpenRouter to process and provide AI-generated feedback and grades. Essay texts
                submitted for feedback are sent to these providers&apos; servers. They may process this data outside
                the UK/EEA, but contractual safeguards such as Standard Contractual Clauses are in place to protect
                your data in compliance with GDPR.
              </p>
              <p className="text-slate-700">
                Our AI providers act strictly as processors and do not use your data for their own model training
                or improvement when accessed via our API.
              </p>
            </section>

            {/* 8. International Data Transfers */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">8. International Data Transfers</h2>
              <p className="text-slate-700">
                Some of our service providers (including Stripe, Clerk, Convex, and AI providers)
                may process your data outside the UK or EEA. In these cases, we ensure that appropriate
                safeguards—such as Standard Contractual Clauses or the UK International Data Transfer
                Agreement—are implemented to protect your data.
              </p>
            </section>

            {/* 9. Automated Decision-Making & AI Model Explainability */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">9. Automated Decision-Making & AI Model Explainability</h2>
              <p className="mb-4 text-slate-700">
                Our Platform uses artificial intelligence (AI) to generate feedback and grade predictions.
                These outputs are produced via automated processes using large language models.
              </p>
              <ul className="list-disc space-y-2 pl-6 text-slate-700">
                <li>
                  <strong>Explainability:</strong>
                  {' '}
                  The AI analyzes the structure, language, and content of
                  your submission to provide feedback aligned with common academic standards. If you would
                  like more information about how these recommendations are produced, or want to know the
                  main criteria used by the AI, you may request an explanation by contacting us.
                </li>
                <li>
                  <strong>Your Rights:</strong>
                  {' '}
                  You may request a human review of any AI-generated decision
                  or output that you feel has a significant impact on you, and you are entitled to an
                  explanation of the decision-making process in clear, understandable language.
                </li>
              </ul>
            </section>

            {/* 10. Legal Basis for Processing */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">10. Legal Basis for Processing</h2>
              <p className="mb-4 text-slate-700">We process your data on the following grounds:</p>
              <ul className="list-disc space-y-2 pl-6 text-slate-700">
                <li>
                  <strong>Contractual necessity:</strong>
                  {' '}
                  To provide you with our services.
                </li>
                <li>
                  <strong>Legitimate interests:</strong>
                  {' '}
                  To improve our Platform, maintain security, prevent fraud, and conduct analytics.
                </li>
                <li>
                  <strong>Consent:</strong>
                  {' '}
                  For optional features (e.g., marketing, accessibility support, research/model training).
                </li>
                <li>
                  <strong>Legal obligations:</strong>
                  {' '}
                  Compliance with UK law and regulatory requirements.
                </li>
              </ul>
            </section>

            {/* 11. How We Share Your Data */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">11. How We Share Your Data</h2>
              <p className="mb-4 text-slate-700">
                We do
                {' '}
                <strong>not</strong>
                {' '}
                sell your data. We may share your data in the following limited circumstances:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-slate-700">
                <li>
                  <strong>Service Providers:</strong>
                  {' '}
                  With trusted third-party IT, payment, analytics, communications, and cloud service providers under strict contractual controls.
                </li>
                <li>
                  <strong>Academic Institutions:</strong>
                  {' '}
                  Only with your explicit consent or at your request (e.g., for institutional integration).
                </li>
                <li>
                  <strong>Legal/Regulatory:</strong>
                  {' '}
                  If required by law, regulation, court order, or for the protection of our rights or safety.
                </li>
                <li>
                  <strong>Business Transfers:</strong>
                  {' '}
                  In the event of a business reorganisation, merger, or sale, we will notify you before your data is transferred and becomes subject to a different policy.
                </li>
              </ul>
            </section>

            {/* 12. Your Rights (UK GDPR) */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">12. Your Rights (UK GDPR)</h2>
              <p className="mb-4 text-slate-700">You have the right to:</p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-700">
                <li>
                  <strong>Access</strong>
                  {' '}
                  your data and receive a copy.
                </li>
                <li>
                  <strong>Rectify</strong>
                  {' '}
                  inaccurate or incomplete data.
                </li>
                <li>
                  <strong>Erase</strong>
                  {' '}
                  your data (&quot;right to be forgotten&quot;) in certain circumstances.
                </li>
                <li>
                  <strong>Restrict</strong>
                  {' '}
                  or object to processing.
                </li>
                <li>
                  <strong>Data portability</strong>
                  {' '}
                  (receive your data in a usable format).
                </li>
                <li>
                  <strong>Withdraw consent</strong>
                  {' '}
                  at any time where processing is based on consent.
                </li>
                <li>
                  <strong>Complain</strong>
                  {' '}
                  to the UK Information Commissioner&apos;s Office (ICO).
                </li>
              </ul>
              <p className="text-slate-700">
                Requests can be made by contacting support@markm8.com. We may need to verify your identity before responding.
              </p>
            </section>

            {/* 13. Children's Data */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">13. Children&apos;s Data</h2>
              <p className="text-slate-700">
                Our Platform is intended for students and is generally used by those aged 16 and above.
                We do not knowingly collect data from children under 13. If you believe a child&apos;s
                data has been provided without appropriate consent, please contact us.
              </p>
            </section>

            {/* 14. Cookies & Tracking */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">14. Cookies & Tracking</h2>
              <p className="text-slate-700">
                We use cookies and similar technologies to operate our Platform, analyze usage, and improve
                user experience. You will be presented with a cookie banner when you first visit the site,
                allowing you to manage your preferences in accordance with UK law. See our
                {' '}
                <Link href="/cookies" className="text-violet-600 underline hover:text-violet-700">
                  Cookie Policy
                </Link>
                {' '}
                for full details.
              </p>
            </section>

            {/* 15. Third-Party Links */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">15. Third-Party Links</h2>
              <p className="text-slate-700">
                Our Platform may contain links to third-party websites or services. We are not responsible
                for the privacy practices of those sites. We recommend reading their privacy policies.
              </p>
            </section>

            {/* 16. Updates to This Policy */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">16. Updates to This Policy</h2>
              <p className="text-slate-700">
                We may update this Privacy Policy from time to time. Changes will be posted on this page,
                and where material, we will notify users directly. Continued use of the Platform constitutes
                acceptance of any changes.
              </p>
            </section>

            {/* 17. Contact Us */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">17. Contact Us</h2>
              <p className="mb-4 text-slate-700">
                If you have questions, concerns, or requests regarding your privacy or this policy, please contact:
              </p>
              <p className="text-slate-700">
                <strong>Email:</strong>
                {' '}
                support@markm8.com
                <br />
                <strong>Address:</strong>
                {' '}
                London, United Kingdom
              </p>
            </section>

            {/* Company Information */}
            <section className="mt-12 border-t border-slate-200 pt-8">
              <p className="text-center text-sm text-slate-600">
                <strong>MarkM8</strong>
                <br />
                London, United Kingdom
              </p>
            </section>
          </div>

          {/* Back to Home Button */}
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-flex items-center rounded-md border border-transparent bg-violet-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-violet-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
