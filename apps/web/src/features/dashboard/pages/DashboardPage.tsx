import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { fetchDashboardAnalytics } from "@/features/dashboard/api";
import { DashboardSection } from "@/features/dashboard/components/DashboardSection";
import { DashboardStatCard } from "@/features/dashboard/components/DashboardStatCard";
import type { DistributionBarDatum } from "@/features/dashboard/components/DistributionBarChart";
import { DistributionBarChart } from "@/features/dashboard/components/DistributionBarChart";
import { LowStockTable } from "@/features/dashboard/components/LowStockTable";
import { RecentPurchaseOrdersTable } from "@/features/dashboard/components/RecentPurchaseOrdersTable";
import { RecentSalesOrdersTable } from "@/features/dashboard/components/RecentSalesOrdersTable";
import type { DashboardAnalytics } from "@/features/dashboard/types";
import { conditionGradeBarClass, returnStatusBarClass } from "@/features/dashboard/utils/chartColors";
import { RMA_STATUS_LABELS } from "@/features/returns/constants/statusLabels";
import type { ReturnRequestStatus } from "@/features/returns/types";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";

const RECENT_LIMIT = 8;
const LOW_STOCK_THRESHOLD = 5;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardAnalytics({ low_stock_threshold: LOW_STOCK_THRESHOLD, recent_limit: RECENT_LIMIT })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(extractApiErrorMessage(e, "Could not load dashboard. Is the API running?"));
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const k = data?.kpis;

  const returnsChartData: DistributionBarDatum[] = useMemo(() => {
    const rows = data?.returns_by_status ?? [];
    return rows.map((row) => ({
      key: row.status,
      label: RMA_STATUS_LABELS[row.status as ReturnRequestStatus] ?? row.status,
      value: row.count,
      barClassName: returnStatusBarClass(row.status),
    }));
  }, [data?.returns_by_status]);

  const conditionChartData: DistributionBarDatum[] = useMemo(() => {
    const rows = data?.inventory_by_condition_grade ?? [];
    return rows.map((row) => ({
      key: row.condition_grade,
      label: `Grade ${row.condition_grade}`,
      value: row.count,
      barClassName: conditionGradeBarClass(row.condition_grade),
    }));
  }, [data?.inventory_by_condition_grade]);

  return (
    <PageContainer className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-soft">
        <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-brand-100/70 blur-3xl" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-700">IMEITrack</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">Operations dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Real-time snapshot of supply chain, inventory, and fulfillment. Data is loaded from the analytics API.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <section aria-label="Key metrics">
        <h2 className="sr-only">Key metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardStatCard
            label="Suppliers"
            value={loading ? "—" : (k?.total_suppliers ?? "—")}
            accent="indigo"
            loading={loading}
          />
          <DashboardStatCard
            label="Customers"
            value={loading ? "—" : (k?.total_customers ?? "—")}
            accent="slate"
            loading={loading}
          />
          <DashboardStatCard
            label="Available devices"
            value={loading ? "—" : (k?.total_available_devices ?? "—")}
            accent="emerald"
            loading={loading}
          />
          <DashboardStatCard
            label="Sold devices"
            value={loading ? "—" : (k?.total_sold_devices ?? "—")}
            accent="rose"
            loading={loading}
          />
          <DashboardStatCard
            label="Reserved devices"
            value={loading ? "—" : (k?.total_reserved_devices ?? "—")}
            accent="amber"
            loading={loading}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Recent purchase orders"
          description="Latest POs by created date."
          viewAllTo="/purchase-orders"
          viewAllLabel="All purchase orders"
        >
          <RecentPurchaseOrdersTable rows={data?.recent_purchase_orders ?? []} loading={loading} />
        </DashboardSection>

        <DashboardSection
          title="Recent sales orders"
          description="Latest customer orders."
          viewAllTo="/sales-orders"
          viewAllLabel="All sales orders"
        >
          <RecentSalesOrdersTable rows={data?.recent_sales_orders ?? []} loading={loading} />
        </DashboardSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex h-full flex-col">
          <div className="p-6">
            <DistributionBarChart
              title="Return requests by status"
              description="Counts across all RMA statuses."
              data={returnsChartData}
              emptyMessage="No return data."
              valueLabel="requests"
              loading={loading}
            />
          </div>
          {!loading ? (
            <div className="border-t border-slate-100 px-6 py-4">
              <Link
                to="/returns"
                className="inline-flex text-sm font-semibold text-brand-700 hover:text-brand-600"
              >
                Open returns / RMA →
              </Link>
            </div>
          ) : null}
        </Card>
        <Card className="flex h-full flex-col">
          <div className="p-6">
            <DistributionBarChart
              title="Inventory by condition grade"
              description="Device counts grouped by condition (all statuses)."
              data={conditionChartData}
              emptyMessage="No inventory records."
              valueLabel="devices"
              loading={loading}
            />
          </div>
          {!loading ? (
            <div className="border-t border-slate-100 px-6 py-4">
              <Link
                to="/inventory"
                className="inline-flex text-sm font-semibold text-brand-700 hover:text-brand-600"
              >
                Browse inventory →
              </Link>
            </div>
          ) : null}
        </Card>
      </div>

      <DashboardSection
        title="Low stock watchlist"
        description={`Product models at or below ${LOW_STOCK_THRESHOLD} sellable units (available + in stock).`}
        viewAllTo="/inventory"
        viewAllLabel="Open inventory"
      >
        <LowStockTable
          threshold={data?.low_stock.threshold ?? LOW_STOCK_THRESHOLD}
          rows={data?.low_stock.rows ?? []}
          loading={loading}
        />
      </DashboardSection>
    </PageContainer>
  );
}
