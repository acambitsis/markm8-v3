'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Coins, FileText, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { PageTransition } from '@/components/motion/PageTransition';
import { Skeleton } from '@/components/Skeleton';
import { Input } from '@/components/ui/input';
import { useAdminUsers } from '@/hooks/useAdmin';
import { cn } from '@/utils/Helpers';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

export default function AdminUsersPage() {
  const t = useTranslations('AdminUsers');
  const [search, setSearch] = useState('');
  const { users, isLoading } = useAdminUsers(search || undefined);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <PageTransition>
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <h1 className="text-2xl font-bold">{t('title')}</h1>
            </div>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('search_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </motion.div>

      {/* Users List */}
      <motion.div
        className="rounded-xl border bg-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        {isLoading
          ? (
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <div className="flex items-center gap-6">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            )
          : users.length === 0
            ? (
                <div className="py-16 text-center">
                  <Users className="mx-auto size-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    {t('no_users')}
                  </p>
                </div>
              )
            : (
                <motion.div
                  className="divide-y"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {users.map(user => (
                    <motion.div key={user._id} variants={itemVariants}>
                      <Link
                        href={`/admin/users/${user._id}`}
                        className="group flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                      >
                        {/* Avatar */}
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {user.email.charAt(0).toUpperCase()}
                        </div>

                        {/* User Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium group-hover:text-primary">
                            {user.name ?? user.email.split('@')[0]}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="hidden items-center gap-6 text-sm md:flex">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Coins className="size-4" />
                            <span className={cn(
                              'font-medium tabular-nums',
                              Number.parseFloat(user.creditBalance) > 0 ? 'text-green-600' : '',
                            )}
                            >
                              {user.creditBalance}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <FileText className="size-4" />
                            <span className="font-medium tabular-nums">{user.essayCount}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </span>
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
      </motion.div>

      {/* Results count */}
      {!isLoading && users.length > 0 && (
        <motion.p
          className="mt-4 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {users.length}
          {' '}
          user
          {users.length !== 1 ? 's' : ''}
          {' '}
          found
        </motion.p>
      )}
    </PageTransition>
  );
}
