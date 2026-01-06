'use client';

import { useUser } from '@clerk/nextjs';
import { ArrowRight, Clock, FileText, PenLine, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { SlideIn, StaggerContainer, StaggerItem } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RecentEssays } from '@/features/dashboard/RecentEssays';
import { useCredits } from '@/hooks/useCredits';

const DashboardIndexPage = () => {
  const { user } = useUser();
  const { credits } = useCredits();
  const firstName = user?.firstName || 'there';
  const available = Number.parseFloat(credits?.available ?? '0');

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <SlideIn direction="up" delay={0}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-8 md:p-10">
          {/* Decorative elements */}
          <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 opacity-20">
            <Sparkles className="size-64 text-primary" />
          </div>

          <div className="relative">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Welcome back,
              {' '}
              {firstName}
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Ready to improve your writing? Submit an essay and get AI-powered feedback in minutes.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="group">
                <Link href="/submit">
                  <PenLine className="size-4" />
                  Submit New Essay
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5">
                  <div className="size-2 rounded-full bg-success" />
                  <span className="tabular-nums font-medium">{available.toFixed(2)}</span>
                  <span>credits available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SlideIn>

      {/* Quick Actions */}
      <StaggerContainer delay={0.2} staggerDelay={0.1} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StaggerItem>
          <Card interactive className="group h-full">
            <Link href="/submit" className="block h-full">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <PenLine className="size-5" />
                </div>
                <CardTitle className="text-lg">New Submission</CardTitle>
                <CardDescription>
                  Submit your essay for AI-powered grading and detailed feedback
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card interactive className="group h-full">
            <Link href="/history" className="block h-full">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                  <FileText className="size-5" />
                </div>
                <CardTitle className="text-lg">Essay History</CardTitle>
                <CardDescription>
                  View all your past submissions and track your progress
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card interactive className="group h-full sm:col-span-2 lg:col-span-1">
            <Link href="/dashboard/user-profile" className="block h-full">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                  <Clock className="size-5" />
                </div>
                <CardTitle className="text-lg">Purchase Credits</CardTitle>
                <CardDescription>
                  Need more credits? Top up your balance to continue grading
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Recent Essays */}
      <SlideIn direction="up" delay={0.4}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Essays</CardTitle>
              <CardDescription>
                Your most recent submissions
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/history">
                View all
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentEssays />
          </CardContent>
        </Card>
      </SlideIn>
    </div>
  );
};

export default DashboardIndexPage;
