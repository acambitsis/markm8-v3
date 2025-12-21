import { FileText, PenLine } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { TitleBar } from '@/components/TitleBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RecentEssays } from '@/features/dashboard/RecentEssays';

const DashboardIndexPage = () => {
  const t = useTranslations('DashboardIndex');

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Submit CTA Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenLine className="size-5" />
              Submit an Essay
            </CardTitle>
            <CardDescription>
              Get AI-powered feedback on your essay with detailed grades and improvement suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/submit">
                Start New Submission
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* History Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Essay History
            </CardTitle>
            <CardDescription>
              View all your past submissions and their grades.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/history">
                View All Essays
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Essays */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Essays</CardTitle>
          <CardDescription>
            Your most recent essay submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentEssays />
        </CardContent>
      </Card>
    </>
  );
};

export default DashboardIndexPage;
