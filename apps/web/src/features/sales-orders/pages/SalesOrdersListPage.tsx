import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { listCustomers } from "@/features/customers/api";
import type { Customer } from "@/features/customers/types";
import { listSalesOrders } from "@/features/sales-orders/api";
import { SoStatusBadge } from "@/features/sales-orders/components/SoStatusBadge";
import { SO_STATUS_LABELS } from "@/features/sales-orders/constants/statusLabels";
import type { SalesOrder } from "@/features/sales-orders/types";
import { SALES_ORDER_STATUSES } from "@/features/sales-orders/types";
import { canManageSalesOrders } from "@/features/sales-orders/utils/permissions";
import { formatMoney } from "@/features/customers/utils/formatMoney";
import { linkPrimaryButtonClassName } from "@/components/ui/Button";
import { textLinkNeutralClass } from "@/components/ui/linkStyles";
import { FilterPanel } from "@/components/ui/FilterPanel";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import {
  CopilotQueryKey,
  CopilotQueryValue,
  parseSalesOrderStatusFromQuery,
} from "@/features/assistant/copilotPageContext";

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15";

export default function SalesOrdersListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManage = canManageSalesOrders(user);

  const statusFilter = parseSalesOrderStatusFromQuery(searchParams.get(CopilotQueryKey.status));
  const customerFilter = useMemo(() => {
    const c = searchParams.get(CopilotQueryKey.customer);
    return c && /^\d+$/.test(c) ? c : "";
  }, [searchParams]);
  const sortRecent = searchParams.get(CopilotQueryKey.sort) === CopilotQueryValue.sortRecent;

  const setStatusFilter = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v) next.set(CopilotQueryKey.status, v);
    else next.delete(CopilotQueryKey.status);
    setSearchParams(next, { replace: true });
  };

  const setCustomerFilter = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v) next.set(CopilotQueryKey.customer, v);
    else next.delete(CopilotQueryKey.customer);
    setSearchParams(next, { replace: true });
  };

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rows, setRows] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { notice?: string } | null;
    if (state?.notice) {
      setFlash(state.notice);
      navigate(".", { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listCustomers({ activeOnly: false });
        if (!cancelled) setCustomers(data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listSalesOrders({
          status: statusFilter || undefined,
          customerId: customerFilter ? Number(customerFilter) : undefined,
        });
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError(extractApiErrorMessage(e, "Failed to load sales orders"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, customerFilter]);

  const displayRows = useMemo(() => {
    if (!sortRecent) return rows;
    return [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [rows, sortRecent]);

  const columns: DataTableColumn<SalesOrder>[] = [
    {
      id: "order",
      header: "Order",
      cell: (o) => (
        <Link to={`/sales-orders/${o.id}`} className={textLinkNeutralClass} onClick={(e) => e.stopPropagation()}>
          {o.order_number}
        </Link>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: (o) => (
        <span className="text-slate-800">
          {customers.find((c) => c.id === o.customer_id)?.business_name ?? `Customer #${o.customer_id}`}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (o) => <SoStatusBadge status={o.status} />,
    },
    {
      id: "total",
      header: "Total",
      className: "text-right tabular-nums",
      cell: (o) => <span className="font-medium text-slate-900">{formatMoney(o.total_amount)}</span>,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Sales orders"
        description="Customer orders, device allocation, and fulfillment."
        action={
          canManage ? (
            <Link to="/sales-orders/new" className={linkPrimaryButtonClassName}>
              New sales order
            </Link>
          ) : null
        }
      />

      {flash ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
          role="status"
        >
          {flash}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {sortRecent ? (
        <p className="mb-3 text-xs text-slate-500" role="status">
          Showing newest orders first (from Copilot link). Clear{" "}
          <button
            type="button"
            className="font-semibold text-brand-700 underline decoration-brand-300/80 underline-offset-2 hover:text-brand-800"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete(CopilotQueryKey.sort);
              setSearchParams(next, { replace: true });
            }}
          >
            recent sort
          </button>{" "}
          to use default table order.
        </p>
      ) : null}

      <FilterPanel title="Filter sales orders">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`mt-1 min-w-[180px] ${selectClass}`}
          >
            <option value="">All statuses</option>
            {SALES_ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SO_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Customer</label>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className={`mt-1 min-w-[220px] ${selectClass}`}
          >
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.business_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      </FilterPanel>

      <DataTable
        columns={columns}
        data={displayRows}
        getRowKey={(o) => o.id}
        loading={loading}
        emptyTitle="No sales orders found"
        emptyDescription="Change status or customer filters, or create a new order."
        aria-label="Sales orders"
        onRowClick={(o) => navigate(`/sales-orders/${o.id}`)}
      />
    </PageContainer>
  );
}
