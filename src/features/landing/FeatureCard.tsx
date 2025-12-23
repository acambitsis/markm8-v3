export const FeatureCard = (props: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
    <div className="flex size-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
      {props.icon}
    </div>

    <div className="mt-4 text-lg font-semibold">{props.title}</div>

    <div className="mt-2 text-muted-foreground">{props.children}</div>
  </div>
);
