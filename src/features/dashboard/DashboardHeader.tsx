'use client';

import { UserButton } from '@clerk/nextjs';
import { Menu, Shield } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

import { ActiveLink } from '@/components/ActiveLink';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Button } from '@/components/ui/button';
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
      {/* Left side - Logo and Nav */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center">
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {props.menu.map(item => (
              <li key={item.href}>
                <ActiveLink
                  href={item.href}
                  className="relative rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active=true]:text-foreground"
                  activeClassName="text-foreground bg-muted"
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
                    'ml-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-600',
                    'transition-colors hover:bg-amber-500/20',
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

      {/* Right side - Actions */}
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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
                      className="inline-flex items-center gap-1.5 text-amber-600"
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

        {/* Divider */}
        <div className="hidden h-6 w-px bg-border sm:block" />

        {/* Locale Switcher */}
        <div className="hidden sm:block">
          <LocaleSwitcher />
        </div>

        {/* Divider */}
        <div className="hidden h-6 w-px bg-border sm:block" />

        {/* User Button */}
        <UserButton
          userProfileMode="navigation"
          userProfileUrl={getI18nPath('/dashboard/user-profile', locale)}
          appearance={{
            elements: {
              avatarBox: 'size-9',
              userButtonTrigger: 'rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            },
          }}
        />
      </div>
    </>
  );
};
