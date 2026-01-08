'use client';

import { UserProfile } from '@clerk/nextjs';
import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { AcademicPreferencesPage } from './AcademicPreferencesPage';

type Props = {
  path: string;
};

/**
 * UserProfile component with custom Academic Preferences page
 * Wraps Clerk's UserProfile and adds our custom pages
 */
export function UserProfileWithPreferences({ path }: Props) {
  const t = useTranslations('Settings');

  return (
    <UserProfile
      routing="path"
      path={path}
      appearance={{
        elements: {
          rootBox: 'w-full',
          cardBox: 'w-full flex',
        },
      }}
    >
      <UserProfile.Page
        label={t('academic_tab')}
        url="academic"
        labelIcon={<GraduationCap className="size-4" />}
      >
        <AcademicPreferencesPage />
      </UserProfile.Page>
    </UserProfile>
  );
}
