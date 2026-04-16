type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-slate-600">{description}</p> : null}
      <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
        Module scaffold — connect API routes and tables here.
      </div>
    </div>
  );
}
