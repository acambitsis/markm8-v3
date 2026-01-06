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
      {/* Left side: Logo + Nav */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        <nav className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {props.menu.map(item => (
              <li key={item.href}>
                <ActiveLink
                  href={item.href}
                  className={cn(
                    'relative px-3 py-2 text-sm font-medium text-muted-foreground',
                    'transition-colors hover:text-foreground',
                    'rounded-lg hover:bg-muted/50',
                  )}
                  activeClassName="text-foreground bg-muted/50"
                >
                  {item.label}
                </ActiveLink>
              </li>
            ))}
            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  className={cn(
                    'ml-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5',
                    'bg-amber-500/10 text-amber-600 text-sm font-medium',
                    'transition-colors hover:bg-amber-500/20',
                  )}
                >
                  <Shield className="size-3.5" />
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        {/* Mobile menu */}
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ToggleMenuButton />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {props.menu.map(item => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="w-full">
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin"
                      className="inline-flex w-full items-center gap-1.5 text-amber-600"
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

        {/* Credits */}
        <CreditsDisplay />

        {/* Locale Switcher */}
        <div className="hidden sm:block">
          <LocaleSwitcher />
        </div>

        {/* User Button */}
        <UserButton
          userProfileMode="navigation"
          userProfileUrl={getI18nPath('/dashboard/user-profile', locale)}
          appearance={{
            elements: {
              avatarBox: 'size-8',
              rootBox: 'ml-1',
            },
          }}
        />
      </div>
    </>
  );
};
