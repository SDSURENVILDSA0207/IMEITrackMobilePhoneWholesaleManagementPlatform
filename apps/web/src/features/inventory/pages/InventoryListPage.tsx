import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { DeviceDetailDrawer } from "@/features/inventory/components/DeviceDetailDrawer";
import { listDevices, searchDeviceByImei } from "@/features/inventory/api";
import { CONDITION_LABELS, DEVICE_STATUS_LABELS, LOCK_STATUS_LABELS } from "@/features/inventory/constants/labels";
import type { DeviceDetailed } from "@/features/inventory/types";
import {
  DEVICE_CONDITION_GRADES,
  DEVICE_LOCK_STATUSES,
  DEVICE_STATUSES,
} from "@/features/inventory/types";
import { conditionBadgeClass, lockBadgeClass, statusBadgeClass } from "@/features/inventory/utils/deviceStyles";
import { Button } from "@/components/ui/Button";
import { FilterPanel } from "@/components/ui/FilterPanel";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15";

export default function InventoryListPage() {
  const [brand, setBrand] = useState("");
  const [modelName, setModelName] = useState("");
  const debouncedBrand = useDebouncedValue(brand, 350);
  const debouncedModel = useDebouncedValue(modelName, 350);
  const [conditionGrade, setConditionGrade] = useState("");
  const [lockStatus, setLockStatus] = useState("");
  const [deviceStatus, setDeviceStatus] = useState("");

  const [rows, setRows] = useState<DeviceDetailed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [imeiQuery, setImeiQuery] = useState("");
  const [imeiError, setImeiError] = useState<string | null>(null);

  const [drawerId, setDrawerId] = useState<number | null>(null);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDevices({
        brand: debouncedBrand || undefined,
        model_name: debouncedModel || undefined,
        condition_grade: conditionGrade || undefined,
        lock_status: lockStatus || undefined,
        status: deviceStatus || undefined,
      });
      setRows(data);
    } catch (e) {
      setError(extractApiErrorMessage(e, "Failed to load inventory"));
    } finally {
      setLoading(false);
    }
  }, [debouncedBrand, debouncedModel, conditionGrade, lockStatus, deviceStatus]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  async function handleImeiSearch(e: React.FormEvent) {
    e.preventDefault();
    setImeiError(null);
    const q = imeiQuery.trim();
    if (q.length < 14) {
      setImeiError("Enter a full IMEI (at least 14 digits).");
      return;
    }
    try {
      const d = await searchDeviceByImei(q);
      setDrawerId(d.id);
    } catch (err) {
      setImeiError(extractApiErrorMessage(err, "Device not found"));
    }
  }

  const columns: DataTableColumn<DeviceDetailed>[] = [
    {
      id: "imei",
      header: "IMEI",
      className: "font-mono text-xs",
      cell: (d) => <span className="text-slate-900">{d.imei}</span>,
    },
    {
      id: "product",
      header: "Product",
      cell: (d) =>
        d.product_model ? (
          <div>
            <div className="font-medium text-slate-900">
              {d.product_model.brand} {d.product_model.model_name}
            </div>
            <div className="text-xs text-slate-500">
              {d.product_model.storage} · {d.product_model.color}
            </div>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      id: "condition",
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
      className: "whitespace-nowrap",
      cell: (d) => <span className="text-sm font-medium text-slate-800">{d.battery_health}%</span>,
    },
    {
      id: "lock",
      header: "Lock",
      cell: (d) => (
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${lockBadgeClass(d.lock_status)}`}>
          {LOCK_STATUS_LABELS[d.lock_status]}
        </span>
      ),
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
    {
      id: "batch",
      header: "Batch",
      cell: (d) =>
        d.source_batch ? (
          <Link
            to={`/inventory/batches/${d.source_batch.id}`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            onClick={(e) => e.stopPropagation()}
          >
            {d.source_batch.batch_code}
          </Link>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Device inventory"
        description="Track IMEIs, grades, lock state, and source batches across your wholesale stock."
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <FilterPanel title="Search by IMEI">
        <form onSubmit={handleImeiSearch} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="imei-search" className="sr-only">
              IMEI
            </label>
            <input
              id="imei-search"
              value={imeiQuery}
              onChange={(e) => setImeiQuery(e.target.value.replace(/\D/g, ""))}
              placeholder="15-digit IMEI"
              className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
              maxLength={32}
            />
            {imeiError ? <p className="mt-1 text-xs text-red-600">{imeiError}</p> : null}
          </div>
          <Button type="submit" variant="secondary">
            Find device
          </Button>
        </form>
      </FilterPanel>

      <FilterPanel>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div>
            <label className="block text-xs font-medium text-slate-600">Brand</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Apple"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Model name</label>
            <input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. iPhone 14"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Condition grade</label>
            <select
              value={conditionGrade}
              onChange={(e) => setConditionGrade(e.target.value)}
              className={`mt-1 w-full ${selectClass}`}
            >
              <option value="">All grades</option>
              {DEVICE_CONDITION_GRADES.map((g) => (
                <option key={g} value={g}>
                  {CONDITION_LABELS[g]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Lock status</label>
            <select value={lockStatus} onChange={(e) => setLockStatus(e.target.value)} className={`mt-1 w-full ${selectClass}`}>
              <option value="">All lock states</option>
              {DEVICE_LOCK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LOCK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Status</label>
            <select
              value={deviceStatus}
              onChange={(e) => setDeviceStatus(e.target.value)}
              className={`mt-1 w-full ${selectClass}`}
            >
              <option value="">All statuses</option>
              {DEVICE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {DEVICE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FilterPanel>

      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(d) => d.id}
        loading={loading}
        emptyTitle="No devices match your filters"
        emptyDescription="Broaden brand, model, or status filters—or search by full IMEI above."
        aria-label="Device inventory"
        onRowClick={(d) => setDrawerId(d.id)}
      />
      {!loading && rows.length > 0 ? (
        <p className="text-center text-xs text-slate-500">Click a row for full details. Batch links open in place.</p>
      ) : null}

      <DeviceDetailDrawer deviceId={drawerId} open={drawerId !== null} onClose={() => setDrawerId(null)} />
    </PageContainer>
  );
}
