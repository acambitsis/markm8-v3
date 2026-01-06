import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium',
    'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-primary text-primary-foreground shadow-sm',
          'hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-sm',
        ],
        destructive: [
          'bg-destructive text-destructive-foreground shadow-sm',
          'hover:bg-destructive/90 hover:shadow-md hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-sm',
        ],
        outline: [
          'border border-input bg-background text-foreground shadow-sm',
          'hover:bg-muted hover:border-muted-foreground/20 hover:shadow-md hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-sm',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground shadow-sm',
          'hover:bg-secondary/80 hover:shadow-md hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-sm',
        ],
        ghost: [
          'text-muted-foreground',
          'hover:bg-muted hover:text-foreground',
        ],
        link: [
          'text-primary underline-offset-4',
          'hover:underline',
        ],
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
