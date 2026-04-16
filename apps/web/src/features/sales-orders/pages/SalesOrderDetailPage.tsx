import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/PageSpinner";
import { useToast } from "@/components/ui/toast/useToast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getSalesOrder, updateSalesOrderStatus } from "@/features/sales-orders/api";
import { DeviceAssignmentPanel } from "@/features/sales-orders/components/DeviceAssignmentPanel";
import { SalesOrderSummaryPanel } from "@/features/sales-orders/components/SalesOrderSummaryPanel";
import { SoStatusBadge } from "@/features/sales-orders/components/SoStatusBadge";
import { SO_STATUS_LABELS } from "@/features/sales-orders/constants/statusLabels";
import type { SalesOrderItemDetailed, SalesOrderDetailed, SalesOrderStatus } from "@/features/sales-orders/types";
import { SALES_ORDER_STATUSES } from "@/features/sales-orders/types";
import { canManageSalesOrders } from "@/features/sales-orders/utils/permissions";
import { formatMoney } from "@/features/customers/utils/formatMoney";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

const selectClass =
  "mt-1 w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15";

export default function SalesOrderDetailPage() {
  const { salesOrderId } = useParams<{ salesOrderId: string }>();
  const id = Number(salesOrderId);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const canManage = canManageSalesOrders(user);

  const [order, setOrder] = useState<SalesOrderDetailed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [statusDraft, setStatusDraft] = useState<SalesOrderStatus>("draft");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (Number.isNaN(id) || id < 1) return;
    const data = await getSalesOrder(id);
    setOrder(data);
    setStatusDraft(data.status);
  }, [id]);

  useEffect(() => {
    const state = location.state as { notice?: string } | null;
    if (state?.notice) {
      setFlash(state.notice);
      navigate(".", { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!salesOrderId || Number.isNaN(id) || id < 1) {
      setError("Invalid order.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getSalesOrder(id);
        if (!cancelled) {
          setOrder(data);
          setStatusDraft(data.status);
        }
      } catch (e) {
        if (!cancelled) setError(extractApiErrorMessage(e, "Sales order not found"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [salesOrderId, id]);

  async function handleStatusSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!order || !canManage) return;
    setStatusErr(null);
    setStatusMsg(null);
    setStatusSaving(true);
    try {
      const updated = await updateSalesOrderStatus(order.id, statusDraft);
      setOrder(updated);
      setStatusMsg("Status updated.");
      toast.success("Sales order status updated.");
    } catch (err) {
      const msg = extractApiErrorMessage(err, "Could not update status");
      setStatusErr(msg);
      toast.error(msg);
    } finally {
      setStatusSaving(false);
    }
  }

  const itemColumns: DataTableColumn<SalesOrderItemDetailed>[] = [
    {
      id: "imei",
      header: "IMEI",
      className: "font-mono text-xs",
      cell: (it) => it.device?.imei ?? `Device #${it.device_id}`,
    },
    {
      id: "price",
      header: "Sale price",
      className: "text-right font-medium tabular-nums",
      cell: (it) => formatMoney(it.selling_price),
    },
  ];

  if (loading) {
    return <PageSpinner label="Loading sales order…" />;
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-900">
        <h1 className="text-lg font-semibold">Unable to load order</h1>
        <p className="mt-2 text-sm">{error ?? "Unknown error."}</p>
        <Link to="/sales-orders" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  const assignedIds = order.items?.map((i) => i.device_id) ?? [];

  return (
    <PageContainer className="mx-auto max-w-6xl">
      <div>
        <Link to="/sales-orders" className="text-sm font-medium text-brand-700 hover:text-brand-600">
          ← Sales orders
        </Link>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <PageHeader title={order.order_number} description={`Order #${order.id}`} eyebrow="Sales Orders" />
            <div className="mt-2">
              <SoStatusBadge status={order.status} />
            </div>
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

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Customer</h2>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {order.customer?.business_name ?? `Customer #${order.customer_id}`}
            </p>
            {order.customer ? (
              <Link
                to={`/customers/${order.customer.id}/edit`}
                className="mt-2 inline-block text-sm text-brand-700 hover:underline"
              >
                View customer
              </Link>
            ) : null}
            {order.notes ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{order.notes}</p>
              </div>
            ) : null}
          </Card>

          {canManage ? (
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-900">Update status</h2>
              <form onSubmit={handleStatusSubmit} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label htmlFor="so-status" className="text-xs font-medium text-slate-600">
                    Status
                  </label>
                  <select
                    id="so-status"
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value as SalesOrderStatus)}
                    className={selectClass}
                  >
                    {SALES_ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {SO_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" variant="secondary" disabled={statusSaving || statusDraft === order.status}>
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

          <Card>
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Line items</h2>
              <p className="mt-0.5 text-sm text-slate-600">Devices allocated to this order.</p>
            </div>
            <div className="p-4">
              <DataTable
                columns={itemColumns}
                data={order.items ?? []}
                getRowKey={(i) => i.id}
                emptyTitle="No devices on this order"
                emptyDescription="Assign available or in-stock inventory using the panel below."
                aria-label="Sales order lines"
              />
            </div>
          </Card>

          <DeviceAssignmentPanel
            orderId={order.id}
            orderStatus={order.status}
            assignedDeviceIds={assignedIds}
            canManage={canManage}
            onAdded={() => refresh()}
          />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <SalesOrderSummaryPanel order={order} />
        </div>
      </div>
    </PageContainer>
  );
}
