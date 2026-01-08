import '@/styles/global.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';

import { AllLocales, AppConfig } from '@/utils/AppConfig';

// Geist font family - clean, modern, optimized for UI
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

// Base URL for metadata (OG images, canonical URLs)
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://markm8.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    template: `%s | ${AppConfig.name}`,
    default: `${AppConfig.name} - AI Essay Grading for Students`,
  },
  description: 'Get instant AI-powered essay feedback aligned with university grading standards. Three AI models, one comprehensive grade. Just $1 per essay.',
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
  ],
  // Open Graph - for Facebook, LinkedIn, Discord, etc.
  openGraph: {
    type: 'website',
    siteName: AppConfig.name,
    title: `${AppConfig.name} - AI Essay Grading for Students`,
    description: 'Get instant AI-powered essay feedback aligned with university grading standards. Three AI models, one comprehensive grade. Just $1 per essay.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${AppConfig.name} - AI Essay Grading`,
      },
    ],
  },
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: `${AppConfig.name} - AI Essay Grading for Students`,
    description: 'Get instant AI-powered essay feedback aligned with university grading standards. Three AI models, one comprehensive grade.',
    images: ['/og-image.png'],
  },
};

export function generateStaticParams() {
  return AllLocales.map(locale => ({ locale }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  unstable_setRequestLocale(locale);

  // Using internationalization in Server Components
  const messages = await getMessages({ locale });

  // The `suppressHydrationWarning` in <html> is used to prevent hydration errors caused by `next-themes`.
  // Solution provided by the package itself: https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app

  // The `suppressHydrationWarning` attribute in <body> is used to prevent hydration errors caused by Sentry Overlay,
  // which dynamically adds a `style` attribute to the body tag.
  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground antialiased" suppressHydrationWarning>
        {/* PRO: Dark mode support for Shadcn UI */}
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
        >
          {props.children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
