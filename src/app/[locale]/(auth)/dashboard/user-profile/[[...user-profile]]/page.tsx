import { getTranslations } from 'next-intl/server';

import { TitleBar } from '@/components/TitleBar';
import { UserProfileWithPreferences } from '@/features/profile/UserProfileWithPreferences';
import { getI18nPath } from '@/utils/Helpers';

const UserProfilePage = async (props: { params: Promise<{ locale: string }> }) => {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'UserProfile' });

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <UserProfileWithPreferences path={getI18nPath('/dashboard/user-profile', locale)} />
    </>
  );
};

export default UserProfilePage;
