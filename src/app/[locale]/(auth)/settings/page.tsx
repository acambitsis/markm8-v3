'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillingHistory } from '@/features/billing/BillingHistory';
import { CreditsPurchaseSection } from '@/features/billing/CreditsPurchaseSection';
import { useCredits } from '@/hooks/useCredits';

function SettingsContent() {
  const t = useTranslations('Settings');
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'credits';
  const { credits, isLoading } = useCredits();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="credits">{t('credits_tab')}</TabsTrigger>
          <TabsTrigger value="billing">{t('billing_tab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="credits">
          <Card>
            <CardHeader>
              <CardTitle>{t('credits_title')}</CardTitle>
              <CardDescription>
                {t('current_balance')}
                {' '}
                <strong>
                  {isLoading ? '...' : credits?.available ?? '0.00'}
                </strong>
                {' '}
                {t('credits_unit')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading...</div>}>
                <CreditsPurchaseSection />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>{t('billing_title')}</CardTitle>
              <CardDescription>
                {t('billing_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BillingHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
