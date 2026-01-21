'use client';

import { UserButton } from '@clerk/nextjs';
import {
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/templates/Logo';
import { cn, getI18nPath } from '@/utils/Helpers';

const adminNavItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
  },
  {
    href: '/admin/transactions',
    label: 'Transactions',
    icon: CreditCard,
  },
  {
    href: '/admin/audit',
    label: 'Audit Log',
    icon: ClipboardList,
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export function AdminHeader() {
  const pathname = usePathname();
  const locale = useLocale();

  // Remove locale prefix from pathname for comparison
  const normalizedPathname = pathname.replace(`/${locale}`, '') || '/';

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return normalizedPathname === href;
    }
    return normalizedPathname.startsWith(href);
  };

  return (
    <>
      <div className="flex items-center">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo />
          <span className="rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
            Admin
          </span>
        </Link>

        <nav className="ml-8 max-lg:hidden">
          <ul className="flex flex-row items-center gap-x-1">
            {adminNavItems.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive(item.href, item.exact)
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div>
        <ul className="flex items-center gap-x-1.5 [&_li[data-fade]:hover]:opacity-100 [&_li[data-fade]]:opacity-60">
          <li>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Exit Admin
            </Link>
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
}
