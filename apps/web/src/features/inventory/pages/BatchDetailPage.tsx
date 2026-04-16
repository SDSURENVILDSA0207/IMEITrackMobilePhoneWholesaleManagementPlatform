import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/PageSpinner";
import { AddDeviceToBatchForm } from "@/features/inventory/components/AddDeviceToBatchForm";
import { BulkDeviceIntakeForm } from "@/features/inventory/components/BulkDeviceIntakeForm";
import { DeviceDetailDrawer } from "@/features/inventory/components/DeviceDetailDrawer";
import { getBatchDevices, getInventoryBatch, listProductModels } from "@/features/inventory/api";
import { CONDITION_LABELS, DEVICE_STATUS_LABELS } from "@/features/inventory/constants/labels";
import type { Device, InventoryBatch, ProductModel } from "@/features/inventory/types";
import { conditionBadgeClass, statusBadgeClass } from "@/features/inventory/utils/deviceStyles";
import { canManageInventory } from "@/features/inventory/utils/permissions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getSupplier } from "@/features/suppliers/api";
import type { Supplier } from "@/features/suppliers/types";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

export default function BatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const id = Number(batchId);
  const { user } = useAuth();
  const canManage = canManageInventory(user);

  const [batch, setBatch] = useState<InventoryBatch | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const [productModels, setProductModels] = useState<ProductModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!batchId || Number.isNaN(id) || id < 1) return;
    const [b, bd, pm] = await Promise.all([
      getInventoryBatch(id),
      getBatchDevices(id),
      listProductModels(),
    ]);
    setBatch(b);
    setDevices(bd.devices);
    setBatchTotal(bd.total);
    setProductModels(pm);
    if (b.supplier_id) {
      try {
        const s = await getSupplier(b.supplier_id);
        setSupplier(s);
      } catch {
        setSupplier(null);
      }
    } else {
      setSupplier(null);
    }
  }, [batchId, id]);

  useEffect(() => {
    if (!batchId || Number.isNaN(id) || id < 1) {
      setError("Invalid batch.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refresh();
      } catch (e) {
        if (!cancelled) setError(extractApiErrorMessage(e, "Failed to load batch"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchId, id, refresh]);

  const columns: DataTableColumn<Device>[] = [
    {
      id: "imei",
      header: "IMEI",
      className: "font-mono text-xs",
      cell: (d) => d.imei,
    },
    {
      id: "grade",
      header: "Grade",
      cell: (d) => (
        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${conditionBadgeClass(d.condition_grade)}`}>
          {CONDITION_LABELS[d.condition_grade]}
        </span>
      ),
    },
    {
      id: "battery",
      header: "Battery",
      cell: (d) => `${d.battery_health}%`,
    },
    {
      id: "status",
      header: "Status",
      cell: (d) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${statusBadgeClass(d.status)}`}
        >
          {DEVICE_STATUS_LABELS[d.status]}
        </span>
      ),
    },
  ];

  if (loading) {
    return <PageSpinner label="Loading batch…" />;
  }

  if (error || !batch) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-900">
        <h1 className="text-lg font-semibold">Unable to load batch</h1>
        <p className="mt-2 text-sm">{error ?? "Unknown error."}</p>
        <Link to="/inventory" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
          Back to inventory
        </Link>
      </div>
    );
  }

  return (
    <PageContainer>
      <div>
        <Link to="/inventory" className="text-sm font-medium text-brand-700 hover:text-brand-600">
          ← Device inventory
        </Link>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <PageHeader title={batch.batch_code} description={`Batch #${batch.id}${batch.received_date ? ` · Received ${batch.received_date}` : ""}`} eyebrow="Inventory" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Units in batch</p>
            <p className="text-2xl font-semibold tabular-nums text-slate-900">{batchTotal}</p>
            <p className="text-xs text-slate-500">Total received (synced)</p>
          </div>
        </div>
      </div>

      <Card className="grid gap-4 p-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{supplier?.name ?? `Supplier #${batch.supplier_id}`}</p>
          {supplier ? (
            <Link to={`/suppliers/${supplier.id}/edit`} className="mt-2 inline-block text-sm text-brand-700 hover:underline">
              View supplier
            </Link>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase order</p>
          <p className="mt-1 text-sm text-slate-800">
            {batch.purchase_order_id ? `PO #${batch.purchase_order_id}` : "—"}
          </p>
        </div>
        {batch.notes ? (
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{batch.notes}</p>
          </div>
        ) : null}
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Devices in this batch</h2>
          <p className="mt-0.5 text-sm text-slate-600">Click a row for full device details.</p>
        </div>
        <div className="p-4">
          <DataTable
            columns={columns}
            data={devices}
            getRowKey={(d) => d.id}
            emptyMessage="No devices linked to this batch yet."
            aria-label="Batch devices"
            onRowClick={(d) => setDrawerId(d.id)}
          />
        </div>
      </Card>

      {canManage && productModels.length > 0 ? (
        <Card className="grid gap-8 p-6 lg:grid-cols-1">
          <AddDeviceToBatchForm batchId={batch.id} productModels={productModels} onSuccess={() => void refresh()} />
          <BulkDeviceIntakeForm batchId={batch.id} productModels={productModels} onSuccess={() => void refresh()} />
        </Card>
      ) : null}

      {canManage && productModels.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add at least one product model under master data before intaking devices into this batch.
        </div>
      ) : null}

      {!canManage ? (
        <p className="text-sm text-slate-500">Your role can view this batch but not add devices.</p>
      ) : null}

      <DeviceDetailDrawer deviceId={drawerId} open={drawerId !== null} onClose={() => setDrawerId(null)} />
    </PageContainer>
  );
}
