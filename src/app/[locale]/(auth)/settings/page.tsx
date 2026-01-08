'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditsPurchaseSection } from '@/features/billing/CreditsPurchaseSection';
import { useCredits } from '@/hooks/useCredits';
import { useProfile } from '@/hooks/useProfile';

import type { AcademicLevel } from '../../../../../convex/schema';

const VALID_ACADEMIC_LEVELS: AcademicLevel[] = ['high_school', 'undergraduate', 'postgraduate', 'professional'];

function isAcademicLevel(value: string): value is AcademicLevel {
  return VALID_ACADEMIC_LEVELS.includes(value as AcademicLevel);
}

function SettingsContent() {
  const t = useTranslations('Settings');
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';
  const { credits, isLoading } = useCredits();
  const { profile, updateProfile, isLoading: isProfileLoading } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAcademicLevelChange = async (value: string) => {
    if (!isAcademicLevel(value)) {
      setSaveError('Invalid academic level selected');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await updateProfile({ academicLevel: value });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save academic level');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">{t('profile_tab')}</TabsTrigger>
          <TabsTrigger value="credits">{t('credits_tab')}</TabsTrigger>
          <TabsTrigger value="billing">{t('billing_tab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-6">
            {/* Academic Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle>{t('academic_profile_title')}</CardTitle>
                <CardDescription>
                  {t('academic_profile_description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('academic_level_label')}
                  </label>
                  <Select
                    value={profile?.academicLevel ?? ''}
                    onValueChange={handleAcademicLevelChange}
                    disabled={isProfileLoading || isSaving}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder={t('academic_level_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">{t('level_high_school')}</SelectItem>
                      <SelectItem value="undergraduate">{t('level_undergraduate')}</SelectItem>
                      <SelectItem value="postgraduate">{t('level_postgraduate')}</SelectItem>
                      <SelectItem value="professional">{t('level_professional')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('academic_level_help')}
                  </p>
                  {saveError && (
                    <p className="mt-2 text-sm text-destructive">{saveError}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t('profile_title')}</CardTitle>
                <CardDescription>
                  {t('profile_description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('profile_coming_soon')}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
              <p className="text-muted-foreground">
                {t('billing_coming_soon')}
              </p>
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
