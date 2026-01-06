'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { cn } from '@/utils/Helpers';

type GlowButtonProps = {
  children: React.ReactNode;
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
  arrow?: boolean;
};

export function GlowButton({
  children,
  href,
  variant = 'primary',
  size = 'lg',
  className,
  glow = true,
  arrow = true,
}: GlowButtonProps) {
  const baseStyles = {
    primary: 'bg-violet-600 text-white hover:bg-violet-700 shadow-purple',
    secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
    ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100',
  };

  const sizeStyles = {
    default: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-lg',
  };

  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {glow && variant === 'primary' && (
        <motion.div
          className="absolute -inset-1 rounded-xl bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-70"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ backgroundSize: '200% 200%' }}
        />
      )}
      <Link
        href={href}
        className={cn(
          buttonVariants({ size: 'lg' }),
          'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold transition-all duration-300',
          baseStyles[variant],
          sizeStyles[size],
          className,
        )}
      >
        <span className="relative z-10 flex items-center gap-2">
          {children}
          {arrow && (
            <motion.svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              initial={{ x: 0 }}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </motion.svg>
          )}
        </span>

        {variant === 'primary' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ opacity: 0.3 }}
          />
        )}
      </Link>
    </motion.div>
  );
}

type IconButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  label: string;
};

export function IconButton({ children, onClick, className, label }: IconButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex size-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white',
        'border border-slate-200 shadow-sm hover:shadow-md',
        className,
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      {children}
    </motion.button>
  );
}
