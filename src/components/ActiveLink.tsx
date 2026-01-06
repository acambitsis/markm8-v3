'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/utils/Helpers';

type ActiveLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
};

export const ActiveLink = ({
  href,
  children,
  className,
  activeClassName = 'bg-primary text-primary-foreground',
}: ActiveLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname.endsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        className,
        isActive && activeClassName,
      )}
    >
      {children}
    </Link>
  );
};
