import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground',
        secondary:
          'border-transparent bg-muted text-muted-foreground',
        destructive:
          'border-transparent bg-destructive/10 text-destructive',
        success:
          'border-transparent bg-success/10 text-success',
        outline:
          'border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);
