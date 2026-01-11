import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Cookie Policy | MarkM8',
  description: 'Learn how MarkM8 uses cookies and similar technologies to provide and improve our AI-powered essay grading service.',
};

export default async function CookiePolicy(props: { params: Promise<{ locale: string }> }) {
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
          <h1 className="mb-2 text-4xl font-bold text-slate-900">Cookie Policy</h1>
          <p className="mb-8 text-sm text-slate-600">
            Last Updated:
            {' '}
            {lastUpdated}
          </p>

          <div className="prose prose-slate max-w-none">
            {/* 1. About this Cookie Policy */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">1. About this Cookie Policy</h2>
              <p className="text-slate-700">
                This Cookie Policy explains how MarkM8 (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) uses cookies and similar technologies on our website and platform (&quot;Platform&quot;). It explains what these technologies are, why we use them, and your choices regarding their use.
              </p>
            </section>

            {/* 2. What are cookies? */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">2. What are cookies?</h2>
              <p className="text-slate-700">
                Cookies are small text files that are placed on your device by websites you visit. They are widely used to make websites work, or work more efficiently, as well as to provide information to site owners. Similar technologies (such as local storage, pixels, or web beacons) are also used for similar purposes.
              </p>
            </section>

            {/* 3. What cookies do we use and why? */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">3. What cookies do we use and why?</h2>
              <p className="mb-6 text-slate-700">We use the following categories of cookies on our Platform:</p>

              <div className="space-y-6">
                {/* Strictly Necessary Cookies */}
                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                  <h3 className="mb-3 text-xl font-semibold text-red-900">a. Strictly Necessary Cookies</h3>
                  <p className="mb-4 text-slate-700">
                    These cookies are required for the operation of our Platform, such as enabling you to log in securely and manage your account. Without these, our website would not function properly.
                  </p>
                  <div className="rounded-lg bg-white p-4">
                    <h4 className="mb-2 font-semibold text-slate-900">Examples:</h4>
                    <ul className="list-disc space-y-1 pl-6 text-slate-700">
                      <li>Session cookies to manage log-ins (set by MarkM8 and Clerk)</li>
                      <li>Security cookies to protect against fraud and abuse (set by Stripe)</li>
                    </ul>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <h3 className="mb-3 text-xl font-semibold text-blue-900">b. Analytics Cookies</h3>
                  <p className="mb-2 text-slate-700">
                    We may use analytics services to collect information about how users interact with our Platform. This helps us improve our service and understand usage patterns.
                  </p>
                  <div className="mt-3 rounded-lg bg-blue-100 p-3">
                    <p className="font-medium text-blue-800">These cookies will only be set with your consent.</p>
                  </div>
                </div>

                {/* Functionality Cookies */}
                <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                  <h3 className="mb-3 text-xl font-semibold text-green-900">c. Functionality Cookies</h3>
                  <p className="text-slate-700">
                    These cookies enable enhanced features, such as remembering your preferences or language settings.
                  </p>
                </div>

                {/* Third-Party Cookies */}
                <div className="rounded-lg border border-violet-200 bg-violet-50 p-6">
                  <h3 className="mb-3 text-xl font-semibold text-violet-900">d. Third-Party Cookies</h3>
                  <p className="text-slate-700">
                    Some cookies are set by trusted third-party services (for example, when you sign in with Clerk or make a payment with Stripe). These services have their own cookie policies.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. How can you manage cookies? */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">4. How can you manage cookies?</h2>
              <p className="mb-4 text-slate-700">
                On your first visit to our Platform, you will see a cookie banner allowing you to accept, reject, or customise your cookie preferences. You can change your preferences at any time through your browser settings.
              </p>

              <p className="mb-4 text-slate-700">
                You can also manage cookies through your browser settings. Most browsers allow you to refuse or delete cookies. For more information, see:
              </p>

              <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-700">
                <li>
                  <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline hover:text-violet-700">
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline hover:text-violet-700">
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline hover:text-violet-700">
                    Microsoft Edge
                  </a>
                </li>
                <li>
                  <a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline hover:text-violet-700">
                    Safari
                  </a>
                </li>
              </ul>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-amber-800">
                  <strong>Please note:</strong>
                  {' '}
                  Disabling some cookies may affect the functionality of our Platform.
                </p>
              </div>
            </section>

            {/* 5. Updates to this Policy */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">5. Updates to this Policy</h2>
              <p className="text-slate-700">
                We may update this Cookie Policy from time to time. Any changes will be posted on this page. Please check back regularly to stay informed.
              </p>
            </section>

            {/* 6. Contact Us */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-slate-900">6. Contact Us</h2>
              <p className="mb-4 text-slate-700">
                If you have any questions about our use of cookies, please contact:
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
