import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { listReturnRequests } from "@/features/returns/api";
import { RmaStatusBadge } from "@/features/returns/components/RmaStatusBadge";
import { RMA_STATUS_LABELS } from "@/features/returns/constants/statusLabels";
import type { ReturnRequestDetailed, ReturnRequestStatus } from "@/features/returns/types";
import { RETURN_REQUEST_STATUSES } from "@/features/returns/types";
import { canCreateReturnRequest } from "@/features/returns/utils/permissions";
import { FilterPanel } from "@/components/ui/FilterPanel";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function ReturnsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canCreate = canCreateReturnRequest(user);

  const [statusFilter, setStatusFilter] = useState("");
  const [rows, setRows] = useState<ReturnRequestDetailed[]>([]);
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
      setLoading(true);
      setError(null);
      try {
        const data = await listReturnRequests({
          status: statusFilter ? (statusFilter as ReturnRequestStatus) : undefined,
        });
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError(extractApiErrorMessage(e, "Failed to load return requests"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  const columns: DataTableColumn<ReturnRequestDetailed>[] = [
    {
      id: "id",
      header: "Return #",
      cell: (r) => (
        <Link
          to={`/returns/${r.id}`}
          className="font-semibold text-indigo-600 hover:text-indigo-500"
          onClick={(e) => e.stopPropagation()}
        >
          #{r.id}
        </Link>
      ),
    },
    {
      id: "order",
      header: "Sales order",
      cell: (r) => (
        <span className="text-slate-800">
          {r.sales_order?.order_number ?? `Order #${r.sales_order_id}`}
        </span>
      ),
    },
    {
      id: "imei",
      header: "Device IMEI",
      className: "font-mono text-xs",
      cell: (r) => <span>{r.device?.imei ?? `Device #${r.device_id}`}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => <RmaStatusBadge status={r.status} />,
    },
    {
      id: "created",
      header: "Opened",
      cell: (r) => <span className="text-slate-600">{formatWhen(r.created_at)}</span>,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Returns / RMA"
        description="Track return requests against shipped or delivered sales orders."
        action={
          canCreate ? (
            <Link
              to="/returns/new"
              className="inline-flex items-center justify-center rounded-lg border border-brand-600 bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 hover:border-brand-500"
            >
              New return request
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

      <FilterPanel title="Filter returns">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`mt-1 min-w-[200px] ${selectClass}`}
          >
            <option value="">All statuses</option>
            {RETURN_REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {RMA_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      </FilterPanel>

      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(r) => r.id}
        loading={loading}
        emptyTitle="No return requests"
        emptyDescription="No RMA records match the selected status. Open a return from a shipped or delivered order."
        aria-label="Return requests"
        onRowClick={(r) => navigate(`/returns/${r.id}`)}
      />
    </PageContainer>
  );
}
