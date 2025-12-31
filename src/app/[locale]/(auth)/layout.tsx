import { enUS, frFR } from '@clerk/localizations';

import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { AppConfig } from '@/utils/AppConfig';

export default async function AuthLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Server Component: unwrap Promise params using await
  const { locale } = await props.params;

  // Compute Clerk configuration based on locale
  let clerkLocale = enUS;
  let signInUrl = '/sign-in';
  let signUpUrl = '/sign-up';
  let dashboardUrl = '/dashboard';
  let afterSignOutUrl = '/';

  if (locale === 'fr') {
    clerkLocale = frFR;
  }

  if (locale !== AppConfig.defaultLocale) {
    signInUrl = `/${locale}${signInUrl}`;
    signUpUrl = `/${locale}${signUpUrl}`;
    dashboardUrl = `/${locale}${dashboardUrl}`;
    afterSignOutUrl = `/${locale}${afterSignOutUrl}`;
  }

  // ConvexClientProvider wraps ClerkProvider and ConvexProviderWithClerk
  // This provides both authentication and real-time database access
  return (
    <ConvexClientProvider
      clerkLocale={clerkLocale}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      dashboardUrl={dashboardUrl}
      afterSignOutUrl={afterSignOutUrl}
    >
      {props.children}
    </ConvexClientProvider>
  );
}

export const dynamic = 'force-dynamic';
