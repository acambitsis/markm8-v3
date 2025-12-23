export const FeatureCard = (props: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex size-12 items-center justify-center rounded-xl bg-violet-100">
      {props.icon}
    </div>

    <div className="mt-4 text-lg font-semibold text-slate-900">{props.title}</div>

    <div className="mt-2 text-slate-600">{props.children}</div>
  </div>
);
