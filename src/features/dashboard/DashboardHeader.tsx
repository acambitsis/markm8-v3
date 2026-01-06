'use client';

import { UserButton } from '@clerk/nextjs';
import { Shield } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

import { ActiveLink } from '@/components/ActiveLink';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ToggleMenuButton } from '@/components/ToggleMenuButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { CreditsDisplay } from '@/features/dashboard/CreditsDisplay';
import { useAdminCheck } from '@/hooks/useAdmin';
import { Logo } from '@/templates/Logo';
import { cn, getI18nPath } from '@/utils/Helpers';

export const DashboardHeader = (props: {
  menu: {
    href: string;
    label: string;
  }[];
}) => {
  const locale = useLocale();
  const { isAdmin } = useAdminCheck();

  return (
    <>
      <div className="flex items-center">
        <Link href="/dashboard">
          <Logo />
        </Link>

        <nav className="ml-6 max-lg:hidden">
          <ul className="flex flex-row items-center gap-x-3 text-lg font-medium [&_a:hover]:opacity-100 [&_a]:opacity-75">
            {props.menu.map(item => (
              <li key={item.href}>
                <ActiveLink href={item.href}>{item.label}</ActiveLink>
              </li>
            ))}
            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-2.5 py-1 font-medium text-white',
                    'transition-colors hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500',
                  )}
                >
                  <Shield className="size-4" />
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>

      <div>
        <ul className="flex items-center gap-x-1.5 [&_li[data-fade]:hover]:opacity-100 [&_li[data-fade]]:opacity-60">
          <li data-fade>
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <ToggleMenuButton />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {props.menu.map(item => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href="/admin"
                          className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400"
                        >
                          <Shield className="size-4" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>

          {/* PRO: Dark mode toggle button */}

          <li>
            <CreditsDisplay />
          </li>

          <li>
            <Separator orientation="vertical" className="h-4" />
          </li>

          <li data-fade>
            <LocaleSwitcher />
          </li>

          <li>
            <Separator orientation="vertical" className="h-4" />
          </li>

          <li>
            <UserButton
              userProfileMode="navigation"
              userProfileUrl={getI18nPath('/dashboard/user-profile', locale)}
              appearance={{
                elements: {
                  rootBox: 'px-2 py-1.5',
                },
              }}
            />
          </li>
        </ul>
      </div>
    </>
  );
};
