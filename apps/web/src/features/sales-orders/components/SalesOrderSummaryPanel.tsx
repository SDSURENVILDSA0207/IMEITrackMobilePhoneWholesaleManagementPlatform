import { formatMoney } from "@/features/customers/utils/formatMoney";
import type { SalesOrderDetailed } from "@/features/sales-orders/types";

type SalesOrderSummaryPanelProps = {
  order: SalesOrderDetailed;
};

export function SalesOrderSummaryPanel({ order }: SalesOrderSummaryPanelProps) {
  const lineCount = order.items?.length ?? 0;
  return (
    <aside className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order summary</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">Customer</dt>
          <dd className="max-w-[14rem] text-right font-medium text-slate-900">
            {order.customer?.business_name ?? `Customer #${order.customer_id}`}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">Lines</dt>
          <dd className="font-semibold tabular-nums text-slate-900">{lineCount}</dd>
        </div>
        <div className="border-t border-slate-100 pt-3">
          <div className="flex justify-between gap-4">
            <dt className="font-medium text-slate-700">Total</dt>
            <dd className="text-xl font-bold tabular-nums text-slate-900">{formatMoney(order.total_amount)}</dd>
          </div>
          <p className="mt-1 text-xs text-slate-500">Sum of line selling prices.</p>
        </div>
      </dl>
    </aside>
  );
}
