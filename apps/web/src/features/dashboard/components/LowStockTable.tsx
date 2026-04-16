import type { LowStockProductModelRow } from "@/features/dashboard/types";

type LowStockTableProps = {
  threshold: number;
  rows: LowStockProductModelRow[];
  loading?: boolean;
};

export function LowStockTable({ threshold, rows, loading }: LowStockTableProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        No product models at or below {threshold} available / in-stock units. All clear.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-amber-100/80 bg-amber-50/20">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-amber-100/90 bg-amber-50/50 text-xs font-semibold uppercase tracking-wide text-amber-900/70">
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Storage</th>
            <th className="px-4 py-3">Color</th>
            <th className="px-4 py-3 text-right">Sellable units</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-50">
          {rows.map((row) => (
            <tr key={row.product_model_id} className="hover:bg-white/60">
              <td className="px-4 py-3 font-medium text-slate-900">
                {row.brand} {row.model_name}
              </td>
              <td className="px-4 py-3 text-slate-700">{row.storage}</td>
              <td className="px-4 py-3 text-slate-700">{row.color}</td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`inline-flex min-w-[2rem] justify-end rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums ${
                    row.available_units === 0
                      ? "bg-red-100 text-red-900"
                      : "bg-amber-100 text-amber-950"
                  }`}
                >
                  {row.available_units}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
