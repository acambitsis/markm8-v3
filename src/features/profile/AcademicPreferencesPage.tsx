'use client';

import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProfile } from '@/hooks/useProfile';

import type { AcademicLevel } from '../../../convex/schema';

const VALID_ACADEMIC_LEVELS: AcademicLevel[] = ['high_school', 'undergraduate', 'postgraduate', 'professional'];

function isAcademicLevel(value: string): value is AcademicLevel {
  return VALID_ACADEMIC_LEVELS.includes(value as AcademicLevel);
}

/**
 * Academic Preferences page for Clerk UserProfile custom page
 * Allows users to set their default academic level
 */
export function AcademicPreferencesPage() {
  const t = useTranslations('Settings');
  const { profile, updateProfile, isLoading } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAcademicLevelChange = async (value: string) => {
    if (!isAcademicLevel(value)) {
      setSaveError('Invalid academic level selected');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateProfile({ academicLevel: value });
      setSaveSuccess(true);
      // Clear success message after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save academic level');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{t('academic_profile_title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('academic_profile_description')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <GraduationCap className="size-4 text-muted-foreground" />
            {t('academic_level_label')}
          </label>
          <Select
            value={profile?.academicLevel ?? ''}
            onValueChange={handleAcademicLevelChange}
            disabled={isLoading || isSaving}
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
            <p className="text-sm text-destructive">{saveError}</p>
          )}
          {saveSuccess && (
            <p className="text-sm text-green-600">Saved successfully</p>
          )}
        </div>
      </div>
    </div>
  );
}
