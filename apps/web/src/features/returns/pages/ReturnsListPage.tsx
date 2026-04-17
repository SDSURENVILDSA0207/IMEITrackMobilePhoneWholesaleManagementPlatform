import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { listReturnRequests } from "@/features/returns/api";
import { RmaStatusBadge } from "@/features/returns/components/RmaStatusBadge";
import { RMA_STATUS_LABELS } from "@/features/returns/constants/statusLabels";
import type { ReturnRequestDetailed, ReturnRequestStatus } from "@/features/returns/types";
import { RETURN_REQUEST_STATUSES } from "@/features/returns/types";
import { canCreateReturnRequest } from "@/features/returns/utils/permissions";
import { linkPrimaryButtonClassName } from "@/components/ui/Button";
import { textLinkClass } from "@/components/ui/linkStyles";
import { FilterPanel } from "@/components/ui/FilterPanel";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { CopilotQueryKey, parseReturnStatusFromQuery } from "@/features/assistant/copilotPageContext";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { Select } from "@/components/ui/Select";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const canCreate = canCreateReturnRequest(user);

  const statusFilter = parseReturnStatusFromQuery(searchParams.get(CopilotQueryKey.status));

  const setStatusFilter = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v) next.set(CopilotQueryKey.status, v);
    else next.delete(CopilotQueryKey.status);
    setSearchParams(next, { replace: true });
  };

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

  const returnStatusOptions = useMemo(
    () => [
      { value: "", label: "All statuses" },
      ...RETURN_REQUEST_STATUSES.map((s) => ({ value: s, label: RMA_STATUS_LABELS[s] })),
    ],
    [],
  );

  const columns: DataTableColumn<ReturnRequestDetailed>[] = [
    {
      id: "id",
      header: "Return #",
      cell: (r) => (
        <Link
          to={`/returns/${r.id}`}
          className={`${textLinkClass} font-semibold`}
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
            <Link to="/returns/new" className={linkPrimaryButtonClassName}>
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

      {statusFilter ? (
        <p className="mb-3 text-xs text-slate-500" role="status">
          Status filter from link.{" "}
          <button
            type="button"
            className="font-semibold text-brand-700 underline decoration-brand-300/80 underline-offset-2 hover:text-brand-800"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete(CopilotQueryKey.status);
              setSearchParams(next, { replace: true });
            }}
          >
            Clear filter
          </button>
        </p>
      ) : null}

      <FilterPanel title="Filter returns">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div>
          <label htmlFor="rma-filter-status" className="block text-xs font-medium text-slate-600">
            Status
          </label>
          <div className="min-w-[200px]">
            <Select
              id="rma-filter-status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={returnStatusOptions}
              placeholder="All statuses"
            />
          </div>
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
