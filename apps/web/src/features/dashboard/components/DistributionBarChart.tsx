export type DistributionBarDatum = {
  key: string;
  label: string;
  value: number;
  /** Tailwind classes for the bar fill, e.g. bg-indigo-500 */
  barClassName: string;
};

type DistributionBarChartProps = {
  title: string;
  description?: string;
  data: DistributionBarDatum[];
  emptyMessage?: string;
  valueLabel?: string;
  loading?: boolean;
};

export function DistributionBarChart({
  title,
  description,
  data,
  emptyMessage = "No data yet.",
  valueLabel = "units",
  loading = false,
}: DistributionBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-full flex-col">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>

      {loading ? (
        <ul className="mt-5 space-y-3" aria-hidden>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <li key={i}>
              <div className="flex justify-between gap-3">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-10 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-200" />
              </div>
            </li>
          ))}
        </ul>
      ) : data.length === 0 ? (
        <p className="mt-6 flex flex-1 items-center text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="mt-5 space-y-3" aria-label={title}>
          {data.map((row) => {
            const pct = Math.round((row.value / max) * 100);
            return (
              <li key={row.key}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-slate-700">{row.label}</span>
                  <span className="shrink-0 tabular-nums text-slate-900">
                    {row.value}
                    <span className="ml-1 text-xs font-normal text-slate-500">{valueLabel}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/70">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${row.barClassName}`}
                    style={{ width: `${row.value > 0 ? Math.max(pct, 3) : 0}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
