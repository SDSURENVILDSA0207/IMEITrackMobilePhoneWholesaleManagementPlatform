import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { listPurchaseOrders } from "@/features/purchase-orders/api";
import { PoStatusBadge } from "@/features/purchase-orders/components/PoStatusBadge";
import type { PurchaseOrderDetailed } from "@/features/purchase-orders/types";
import { PO_STATUSES } from "@/features/purchase-orders/types";
import { PO_STATUS_LABELS } from "@/features/purchase-orders/constants/statusLabels";
import { canManagePurchaseOrders } from "@/features/purchase-orders/utils/permissions";
import { listSuppliers } from "@/features/suppliers/api";
import type { Supplier } from "@/features/suppliers/types";
import { formatMoney } from "@/features/customers/utils/formatMoney";
import { linkPrimaryButtonClassName } from "@/components/ui/linkPrimaryButtonClassName";
import { textLinkNeutralClass } from "@/components/ui/linkStyles";
import { FilterPanel } from "@/components/ui/FilterPanel";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import {
  CopilotQueryKey,
  CopilotQueryValue,
  parsePurchaseOrderStatusFromQuery,
} from "@/features/assistant/copilotPageContext";
import { Select } from "@/components/ui/Select";

export default function PurchaseOrdersListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManage = canManagePurchaseOrders(user);

  const statusFilter = parsePurchaseOrderStatusFromQuery(searchParams.get(CopilotQueryKey.status));
  const supplierFilter = useMemo(() => {
    const s = searchParams.get(CopilotQueryKey.supplier);
    return s && /^\d+$/.test(s) ? s : "";
  }, [searchParams]);
  const sortRecent = searchParams.get(CopilotQueryKey.sort) === CopilotQueryValue.sortRecent;

  const setStatusFilter = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v) next.set(CopilotQueryKey.status, v);
    else next.delete(CopilotQueryKey.status);
    setSearchParams(next, { replace: true });
  };

  const setSupplierFilter = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v) next.set(CopilotQueryKey.supplier, v);
    else next.delete(CopilotQueryKey.supplier);
    setSearchParams(next, { replace: true });
  };

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rows, setRows] = useState<PurchaseOrderDetailed[]>([]);
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
        const data = await listSuppliers({ activeOnly: false });
        if (!cancelled) setSuppliers(data);
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
        const data = await listPurchaseOrders({
          status: statusFilter || undefined,
          supplierId: supplierFilter ? Number(supplierFilter) : undefined,
        });
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError(extractApiErrorMessage(e, "Failed to load purchase orders"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, supplierFilter]);

  const displayRows = useMemo(() => {
    if (!sortRecent) return rows;
    return [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [rows, sortRecent]);

  const statusOptions = useMemo(
    () => [
      { value: "", label: "All statuses" },
      ...PO_STATUSES.map((s) => ({ value: s, label: PO_STATUS_LABELS[s] })),
    ],
    [],
  );

  const supplierOptions = useMemo(
    () => [
      { value: "", label: "All suppliers" },
      ...suppliers.map((s) => ({ value: String(s.id), label: s.name })),
    ],
    [suppliers],
  );

  const columns: DataTableColumn<PurchaseOrderDetailed>[] = [
    {
      id: "po",
      header: "PO #",
      className: "font-semibold",
      cell: (po) => (
        <Link to={`/purchase-orders/${po.id}`} className={textLinkNeutralClass} onClick={(e) => e.stopPropagation()}>
          {po.po_number}
        </Link>
      ),
    },
    {
      id: "supplier",
      header: "Supplier",
      cell: (po) => (
        <span className="text-slate-800">{po.supplier?.name ?? `Supplier #${po.supplier_id}`}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (po) => <PoStatusBadge status={po.status} />,
    },
    {
      id: "total",
      header: "Total",
      className: "text-right tabular-nums",
      cell: (po) => <span className="font-medium text-slate-900">{formatMoney(po.total_amount)}</span>,
    },
    {
      id: "eta",
      header: "Expected delivery",
      cell: (po) => (
        <span className="text-slate-600">{po.expected_delivery_date ?? "—"}</span>
      ),
    },
    {
      id: "lines",
      header: "Lines",
      className: "text-right tabular-nums",
      cell: (po) => <span>{po.items?.length ?? 0}</span>,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Purchase orders"
        description="Inbound procurement linked to suppliers."
        action={
          canManage ? (
            <Link to="/purchase-orders/new" className={linkPrimaryButtonClassName}>
              New purchase order
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
          Showing newest POs first (from Copilot link).{" "}
          <button
            type="button"
            className="font-semibold text-brand-700 underline decoration-brand-300/80 underline-offset-2 hover:text-brand-800"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete(CopilotQueryKey.sort);
              setSearchParams(next, { replace: true });
            }}
          >
            Clear recent sort
          </button>
        </p>
      ) : null}

      <FilterPanel title="Filter purchase orders">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div>
          <label htmlFor="po-filter-status" className="block text-xs font-medium text-slate-600">
            Status
          </label>
          <div className="min-w-[180px]">
            <Select
              id="po-filter-status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder="All statuses"
            />
          </div>
        </div>
        <div>
          <label htmlFor="po-filter-supplier" className="block text-xs font-medium text-slate-600">
            Supplier
          </label>
          <div className="min-w-[200px]">
            <Select
              id="po-filter-supplier"
              value={supplierFilter}
              onChange={setSupplierFilter}
              options={supplierOptions}
              placeholder="All suppliers"
            />
          </div>
        </div>
      </div>
      </FilterPanel>

      <DataTable
        columns={columns}
        data={displayRows}
        getRowKey={(po) => po.id}
        loading={loading}
        emptyTitle="No purchase orders found"
        emptyDescription="Try different status or supplier filters, or create a new PO."
        aria-label="Purchase orders"
        onRowClick={(po) => navigate(`/purchase-orders/${po.id}`)}
      />
    </PageContainer>
  );
}
