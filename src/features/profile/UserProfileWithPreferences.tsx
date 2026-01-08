'use client';

import { UserProfile } from '@clerk/nextjs';
import { GraduationCap } from 'lucide-react';

import { AcademicPreferencesPage } from './AcademicPreferencesPage';

type Props = {
  path: string;
};

/**
 * UserProfile component with custom Academic Preferences page
 * Wraps Clerk's UserProfile and adds our custom pages
 */
export function UserProfileWithPreferences({ path }: Props) {
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
        label="Academic"
        url="academic"
        labelIcon={<GraduationCap className="size-4" />}
      >
        <AcademicPreferencesPage />
      </UserProfile.Page>
    </UserProfile>
  );
}
