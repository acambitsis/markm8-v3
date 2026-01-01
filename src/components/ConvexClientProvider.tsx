'use client';

import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import type { ComponentProps, ReactNode } from 'react';

import { Env } from '@/libs/Env';

const convex = new ConvexReactClient(Env.NEXT_PUBLIC_CONVEX_URL);

type ConvexClientProviderProps = {
  children: ReactNode;
  clerkLocale: ComponentProps<typeof ClerkProvider>['localization'];
  signInUrl: string;
  signUpUrl: string;
  dashboardUrl: string;
  afterSignOutUrl: string;
};

export function ConvexClientProvider({
  children,
  clerkLocale,
  signInUrl,
  signUpUrl,
  dashboardUrl,
  afterSignOutUrl,
}: ConvexClientProviderProps) {
  return (
    <ClerkProvider
      localization={clerkLocale}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      signInFallbackRedirectUrl={dashboardUrl}
      signUpFallbackRedirectUrl={dashboardUrl}
      afterSignOutUrl={afterSignOutUrl}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
