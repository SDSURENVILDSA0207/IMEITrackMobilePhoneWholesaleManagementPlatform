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
    <div className="overflow-x-auto rounded-xl border border-amber-100/60 bg-amber-50/15 ring-1 ring-amber-100/35">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-amber-100/70 bg-amber-50/45 text-xs font-semibold uppercase tracking-wide text-amber-900/65">
            <th className="px-5 py-4 align-middle">Product</th>
            <th className="px-5 py-4 align-middle">Storage</th>
            <th className="px-5 py-4 align-middle">Color</th>
            <th className="px-5 py-4 text-right align-middle">Sellable units</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-100/45">
          {rows.map((row) => (
            <tr key={row.product_model_id} className="transition-colors duration-150 hover:bg-amber-50/35">
              <td className="px-5 py-4 align-middle font-medium text-slate-900">
                {row.brand} {row.model_name}
              </td>
              <td className="px-5 py-4 align-middle text-slate-600">{row.storage}</td>
              <td className="px-5 py-4 align-middle text-slate-600">{row.color}</td>
              <td className="px-5 py-4 text-right align-middle">
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
