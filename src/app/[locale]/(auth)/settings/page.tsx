'use client';

import { motion } from 'framer-motion';
import { CreditCard, Sparkles, User } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

import { Shimmer, SlideIn } from '@/components/motion';
import { TitleBar } from '@/components/TitleBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditsPurchaseSection } from '@/features/billing/CreditsPurchaseSection';
import { MainLayout } from '@/features/dashboard/MainLayout';
import { useCredits } from '@/hooks/useCredits';

function CreditsBalance() {
  const { credits, isLoading } = useCredits();

  if (isLoading) {
    return <Shimmer className="inline-block h-6 w-16" />;
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary"
    >
      <Sparkles className="size-3.5" />
      {credits?.available ?? '0.00'}
      {' '}
      credits
    </motion.span>
  );
}

function SettingsContent() {
  const t = useTranslations('Settings');
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';

  return (
    <MainLayout>
      <TitleBar
        title={t('title')}
        description={t('description')}
      />

      <SlideIn direction="up" delay={0.1}>
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="profile" className="gap-2">
              <User className="size-4" />
              <span className="hidden sm:inline">{t('profile_tab')}</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-2">
              <Sparkles className="size-4" />
              <span className="hidden sm:inline">{t('credits_tab')}</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="size-4" />
              <span className="hidden sm:inline">{t('billing_tab')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                    <User className="size-4 text-primary" />
                  </div>
                  {t('profile_title')}
                </CardTitle>
                <CardDescription>
                  {t('profile_description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <User className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">
                    {t('profile_coming_soon')}
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Profile customization is coming soon. You'll be able to manage your account details here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="size-4 text-primary" />
                      </div>
                      {t('credits_title')}
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      {t('current_balance')}
                    </CardDescription>
                  </div>
                  <CreditsBalance />
                </div>
              </CardHeader>
              <CardContent>
                <Suspense fallback={(
                  <div className="space-y-4">
                    <Shimmer className="h-32 rounded-xl" />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Shimmer className="h-48 rounded-xl" />
                      <Shimmer className="h-48 rounded-xl" />
                      <Shimmer className="h-48 rounded-xl" />
                    </div>
                  </div>
                )}
                >
                  <CreditsPurchaseSection />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="size-4 text-primary" />
                  </div>
                  {t('billing_title')}
                </CardTitle>
                <CardDescription>
                  {t('billing_description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <CreditCard className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">
                    {t('billing_coming_soon')}
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Billing history and invoice management coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SlideIn>
    </MainLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={(
      <MainLayout>
        <div className="space-y-6">
          <Shimmer className="h-20 rounded-xl" />
          <Shimmer className="h-[400px] rounded-xl" />
        </div>
      </MainLayout>
    )}
    >
      <SettingsContent />
    </Suspense>
  );
}
