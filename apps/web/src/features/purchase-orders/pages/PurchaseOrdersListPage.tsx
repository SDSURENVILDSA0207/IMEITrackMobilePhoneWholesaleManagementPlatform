import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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
import { FilterPanel } from "@/components/ui/FilterPanel";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15";

export default function PurchaseOrdersListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canManage = canManagePurchaseOrders(user);

  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
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

  const columns: DataTableColumn<PurchaseOrderDetailed>[] = [
    {
      id: "po",
      header: "PO #",
      className: "font-semibold",
      cell: (po) => (
        <Link
          to={`/purchase-orders/${po.id}`}
          className="text-indigo-600 hover:text-indigo-500"
          onClick={(e) => e.stopPropagation()}
        >
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
            <Link
              to="/purchase-orders/new"
              className="inline-flex items-center justify-center rounded-lg border border-brand-600 bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 hover:border-brand-500"
            >
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

      <FilterPanel title="Filter purchase orders">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`mt-1 min-w-[180px] ${selectClass}`}
          >
            <option value="">All statuses</option>
            {PO_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PO_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Supplier</label>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className={`mt-1 min-w-[200px] ${selectClass}`}
          >
            <option value="">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      </FilterPanel>

      <DataTable
        columns={columns}
        data={rows}
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
