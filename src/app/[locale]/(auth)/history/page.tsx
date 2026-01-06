'use client';

import { PenLine } from 'lucide-react';
import Link from 'next/link';

import { SlideIn } from '@/components/motion';
import { TitleBar } from '@/components/TitleBar';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/features/dashboard/MainLayout';
import { EssayHistoryTable } from '@/features/essays/EssayHistoryTable';

export default function HistoryPage() {
  return (
    <MainLayout>
      <TitleBar
        title="Essay History"
        description="View all your past essay submissions and grades"
        action={(
          <Button asChild>
            <Link href="/submit">
              <PenLine className="mr-2 size-4" />
              New Essay
            </Link>
          </Button>
        )}
      />

      <SlideIn direction="up" delay={0.1}>
        <EssayHistoryTable />
      </SlideIn>
    </MainLayout>
  );
}
