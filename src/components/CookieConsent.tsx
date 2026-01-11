'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const COOKIE_CONSENT_KEY = 'markm8-cookie-consent';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to avoid layout shift on initial load
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'dismissed');
    setShowBanner(false);
  };

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
              onClick={handleAccept}
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
            >
              Got it
            </button>
            <button
              onClick={handleDismiss}
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
