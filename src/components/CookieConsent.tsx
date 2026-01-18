'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const COOKIE_CONSENT_KEY = 'markm8-cookie-consent';
const SHOW_DELAY_MS = 1000;

export function CookieConsent(): React.ReactNode {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (hasConsent) {
      return;
    }

    const timer = setTimeout(() => setShowBanner(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismissBanner(status: 'accepted' | 'dismissed'): void {
    localStorage.setItem(COOKIE_CONSENT_KEY, status);
    setShowBanner(false);
  }

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
          <p className="text-sm text-slate-600">
            We use cookies to keep you signed in and improve your experience.
            {' '}
            <Link href="/cookies" className="text-violet-600 underline hover:text-violet-700">
              Learn more
            </Link>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => dismissBanner('accepted')}
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={() => dismissBanner('dismissed')}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
