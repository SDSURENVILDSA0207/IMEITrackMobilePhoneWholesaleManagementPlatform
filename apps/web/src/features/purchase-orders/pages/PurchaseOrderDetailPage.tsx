import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/PageSpinner";
import { useToast } from "@/components/ui/toast/useToast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  getPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
} from "@/features/purchase-orders/api";
import { PoStatusBadge } from "@/features/purchase-orders/components/PoStatusBadge";
import { PO_STATUS_LABELS } from "@/features/purchase-orders/constants/statusLabels";
import type { PurchaseOrderDetailed, PurchaseOrderItem, PurchaseOrderStatus } from "@/features/purchase-orders/types";
import { PO_STATUSES } from "@/features/purchase-orders/types";
import { canManagePurchaseOrders } from "@/features/purchase-orders/utils/permissions";
import { formatMoney } from "@/features/customers/utils/formatMoney";
import { listSuppliers } from "@/features/suppliers/api";
import type { Supplier } from "@/features/suppliers/types";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { formFieldInputClass } from "@/shared/lib/formFieldClasses";

function lineTotal(qty: number, unit: string | null): string {
  if (!unit) return "—";
  const u = Number(unit);
  if (Number.isNaN(u)) return "—";
  return formatMoney(String((qty * u).toFixed(2)));
}

export default function PurchaseOrderDetailPage() {
  const { purchaseOrderId } = useParams<{ purchaseOrderId: string }>();
  const id = Number(purchaseOrderId);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const canManage = canManagePurchaseOrders(user);

  const [po, setPo] = useState<PurchaseOrderDetailed | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [statusDraft, setStatusDraft] = useState<PurchaseOrderStatus>("draft");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);

  const [editPoNumber, setEditPoNumber] = useState("");
  const [editSupplierId, setEditSupplierId] = useState(0);
  const [editEta, setEditEta] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [headerSaving, setHeaderSaving] = useState(false);
  const [headerMsg, setHeaderMsg] = useState<string | null>(null);
  const [headerErr, setHeaderErr] = useState<string | null>(null);

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
    if (!purchaseOrderId || Number.isNaN(id) || id < 1) {
      setError("Invalid purchase order.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPurchaseOrder(id);
        if (cancelled) return;
        setPo(data);
        setStatusDraft(data.status);
        setEditPoNumber(data.po_number);
        setEditSupplierId(data.supplier_id);
        setEditEta(data.expected_delivery_date ?? "");
        setEditNotes(data.notes ?? "");
      } catch (e) {
        if (!cancelled) setError(extractApiErrorMessage(e, "Purchase order not found"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [purchaseOrderId, id]);

  async function handleStatusSave(e: React.FormEvent) {
    e.preventDefault();
    if (!po || !canManage) return;
    setStatusErr(null);
    setStatusMsg(null);
    setStatusSaving(true);
    try {
      const updated = await updatePurchaseOrderStatus(po.id, statusDraft);
      setPo(updated);
      setStatusMsg("Status updated.");
      toast.success("Purchase order status updated.");
    } catch (err) {
      const msg = extractApiErrorMessage(err, "Could not update status");
      setStatusErr(msg);
      toast.error(msg);
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleHeaderSave(e: React.FormEvent) {
    e.preventDefault();
    if (!po || !canManage) return;
    setHeaderErr(null);
    setHeaderMsg(null);
    if (!editPoNumber.trim()) {
      setHeaderErr("PO number is required.");
      return;
    }
    if (!editSupplierId) {
      setHeaderErr("Select a supplier.");
      return;
    }
    setHeaderSaving(true);
    try {
      const updated = await updatePurchaseOrder(po.id, {
        po_number: editPoNumber.trim(),
        supplier_id: editSupplierId,
        expected_delivery_date: editEta.trim() || null,
        notes: editNotes.trim() || null,
      });
      setPo(updated);
      setHeaderMsg("Details saved.");
      toast.success("Purchase order details saved.");
    } catch (err) {
      const msg = extractApiErrorMessage(err, "Could not save changes");
      setHeaderErr(msg);
      toast.error(msg);
    } finally {
      setHeaderSaving(false);
    }
  }

  const itemColumns: DataTableColumn<PurchaseOrderItem>[] = [
    { id: "brand", header: "Brand", cell: (i) => i.brand },
    { id: "model", header: "Model", cell: (i) => i.model_name },
    { id: "storage", header: "Storage", cell: (i) => i.storage },
    { id: "color", header: "Color", cell: (i) => i.color },
    {
      id: "qty",
      header: "Qty",
      className: "text-right tabular-nums",
      cell: (i) => i.expected_quantity,
    },
    {
      id: "unit",
      header: "Unit cost",
      className: "text-right",
      cell: (i) => formatMoney(i.unit_cost),
    },
    {
      id: "line",
      header: "Line total",
      className: "text-right font-medium",
      cell: (i) => lineTotal(i.expected_quantity, i.unit_cost),
    },
  ];

  if (loading) {
    return <PageSpinner label="Loading purchase order…" />;
  }

  if (error || !po) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-900">
        <h1 className="text-lg font-semibold">Unable to load purchase order</h1>
        <p className="mt-2 text-sm">{error ?? "Unknown error."}</p>
        <Link to="/purchase-orders" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <PageContainer className="mx-auto max-w-5xl">
      <div>
        <Link to="/purchase-orders" className="text-sm font-medium text-brand-700 hover:text-brand-600">
          ← Purchase orders
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <PageHeader title={po.po_number} description={`PO #${po.id}`} eyebrow="Purchase Orders" />
            <PoStatusBadge status={po.status} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Order total</p>
            <p className="text-2xl font-semibold tabular-nums text-slate-900">{formatMoney(po.total_amount)}</p>
          </div>
        </div>
      </div>

      {flash ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
          role="status"
        >
          {flash}
        </div>
      ) : null}

      <Card className="grid gap-4 p-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{po.supplier?.name ?? `Supplier #${po.supplier_id}`}</p>
          {po.supplier ? (
            <Link
              to={`/suppliers/${po.supplier.id}/edit`}
              className="mt-2 inline-block text-sm text-brand-700 hover:underline"
            >
              View supplier
            </Link>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expected delivery</p>
          <p className="mt-1 text-sm text-slate-800">{po.expected_delivery_date ?? "—"}</p>
        </div>
        {po.notes ? (
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{po.notes}</p>
          </div>
        ) : null}
      </Card>

      {canManage ? (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900">Update status</h2>
          <form onSubmit={handleStatusSave} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-[200px] flex-1">
              <label htmlFor="po-status-draft" className="text-xs font-medium text-slate-600">
                Status
              </label>
              <select
                id="po-status-draft"
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as PurchaseOrderStatus)}
                className={formFieldInputClass}
              >
                {PO_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PO_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary" disabled={statusSaving || statusDraft === po.status}>
              {statusSaving ? "Saving…" : "Apply status"}
            </Button>
          </form>
          {statusErr ? <p className="mt-2 text-sm text-red-600">{statusErr}</p> : null}
          {statusMsg ? (
            <p className="mt-2 text-sm font-medium text-emerald-800" role="status">
              {statusMsg}
            </p>
          ) : null}
        </Card>
      ) : null}

      {canManage ? (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900">Edit details</h2>
          <form onSubmit={handleHeaderSave} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-600">PO number</label>
              <input className={formFieldInputClass} value={editPoNumber} onChange={(e) => setEditPoNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Supplier</label>
              <select
                className={formFieldInputClass}
                value={editSupplierId}
                onChange={(e) => setEditSupplierId(Number(e.target.value))}
              >
                <option value={0}>Select…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Expected delivery</label>
              <input type="date" className={formFieldInputClass} value={editEta} onChange={(e) => setEditEta(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600">Notes</label>
              <textarea rows={3} className={formFieldInputClass} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={headerSaving}>
                {headerSaving ? "Saving…" : "Save details"}
              </Button>
            </div>
          </form>
          {headerErr ? <p className="mt-2 text-sm text-red-600">{headerErr}</p> : null}
          {headerMsg ? (
            <p className="mt-2 text-sm font-medium text-emerald-800" role="status">
              {headerMsg}
            </p>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Line items</h2>
          <p className="mt-0.5 text-sm text-slate-600">Products on this PO (defined at creation).</p>
        </div>
        <div className="p-4">
          <DataTable
            columns={itemColumns}
            data={po.items ?? []}
            getRowKey={(i) => i.id}
            emptyTitle="No line items"
            emptyDescription="Line items are defined when the purchase order is created."
            aria-label="Purchase order line items"
          />
        </div>
      </Card>
    </PageContainer>
  );
}
