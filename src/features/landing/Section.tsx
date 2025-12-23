import { cn } from '@/utils/Helpers';

export const Section = (props: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
}) => (
  <div className={cn('px-3 py-16', props.className)}>
    {(props.title || props.subtitle || props.description) && (
      <div className="mx-auto mb-12 max-w-screen-md text-center">
        {props.subtitle && (
          <div className="inline-block rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
            {props.subtitle}
          </div>
        )}

        {props.title && (
          <div className="mt-1 text-balance text-3xl font-bold text-slate-900">{props.title}</div>
        )}

        {props.description && (
          <div className="mt-2 text-pretty text-lg text-slate-600">
            {props.description}
          </div>
        )}
      </div>
    )}

    <div className="mx-auto max-w-screen-lg">{props.children}</div>
  </div>
);
