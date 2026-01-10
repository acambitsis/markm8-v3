type Props = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function DashboardSection({ title, description, children }: Props) {
  return (
    <div className="rounded-md bg-card p-5">
      <div className="max-w-3xl">
        <div className="text-lg font-semibold">{title}</div>
        <div className="mb-4 text-sm font-medium text-muted-foreground">
          {description}
        </div>
        {children}
      </div>
    </div>
  );
}
