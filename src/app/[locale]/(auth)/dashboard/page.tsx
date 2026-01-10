'use client';

import { motion } from 'framer-motion';
import { ArrowRight, FileText, History, PenLine, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { PageTransition } from '@/components/motion/PageTransition';
import { Button } from '@/components/ui/button';
import { RecentEssaysV2 } from '@/features/dashboard/RecentEssaysV2';
import { StatsBar } from '@/features/dashboard/StatsBar';

function DashboardIndexPage() {
  return (
    <PageTransition>
      {/* Hero Section - Primary CTA */}
      <motion.section
        className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8 md:p-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-48 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <motion.div
              className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Sparkles className="size-4" />
              AI-Powered Grading
            </motion.div>
            <motion.h1
              className="text-2xl font-bold tracking-tight md:text-3xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Ready to improve your essay?
            </motion.h1>
            <motion.p
              className="mt-2 text-muted-foreground md:text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              Get detailed feedback from multiple AI models. Understand your strengths and areas for improvement.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Button
              asChild
              size="lg"
              className="btn-lift h-14 gap-2 rounded-xl px-8 text-lg shadow-purple-md hover:shadow-purple-lg"
            >
              <Link href="/submit">
                <PenLine className="size-5" />
                Grade My Essay
                <ArrowRight className="ml-1 size-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Bar */}
      <section className="mb-8">
        <StatsBar />
      </section>

      {/* Quick Actions */}
      <motion.section
        className="mb-8 grid gap-4 md:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {/* Submit Card */}
        <Link
          href="/submit"
          className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
            <PenLine className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold group-hover:text-primary">Submit New Essay</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Get AI feedback on your writing
            </p>
          </div>
          <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>

        {/* History Card */}
        <Link
          href="/history"
          className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
            <History className="size-6 text-muted-foreground group-hover:text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold group-hover:text-primary">View All Essays</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Browse your submission history
            </p>
          </div>
          <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>
      </motion.section>

      {/* Recent Essays */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Recent Essays</h2>
          </div>
          <Link
            href="/history"
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            View all
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <RecentEssaysV2 />
      </motion.section>
    </PageTransition>
  );
}

export default DashboardIndexPage;
