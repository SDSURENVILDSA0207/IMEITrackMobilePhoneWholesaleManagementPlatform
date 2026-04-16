import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getDevice } from "@/features/inventory/api";
import { CONDITION_LABELS, DEVICE_STATUS_LABELS, LOCK_STATUS_LABELS } from "@/features/inventory/constants/labels";
import type { DeviceDetailed } from "@/features/inventory/types";
import { conditionBadgeClass, lockBadgeClass, statusBadgeClass } from "@/features/inventory/utils/deviceStyles";
import { formatMoney } from "@/features/customers/utils/formatMoney";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

type DeviceDetailDrawerProps = {
  deviceId: number | null;
  open: boolean;
  onClose: () => void;
};

function BatteryBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="mt-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">{pct}% battery health</p>
    </div>
  );
}

export function DeviceDetailDrawer({ deviceId, open, onClose }: DeviceDetailDrawerProps) {
  const [device, setDevice] = useState<DeviceDetailed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !deviceId) {
      setDevice(null);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await getDevice(deviceId);
        if (!cancelled) setDevice(d);
      } catch (e) {
        if (!cancelled) setError(extractApiErrorMessage(e, "Failed to load device"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, deviceId]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-drawer-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id="device-drawer-title" className="text-lg font-semibold text-slate-900">
              Device details
            </h2>
            <p className="mt-0.5 font-mono text-sm text-slate-600">{device?.imei ?? "—"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="mt-3 text-sm text-slate-600">Loading…</p>
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : device ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                <span
                  className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(device.status)}`}
                >
                  {DEVICE_STATUS_LABELS[device.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Condition</p>
                  <span
                    className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${conditionBadgeClass(device.condition_grade)}`}
                  >
                    {CONDITION_LABELS[device.condition_grade]}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lock</p>
                  <span
                    className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${lockBadgeClass(device.lock_status)}`}
                  >
                    {LOCK_STATUS_LABELS[device.lock_status]}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Battery health</p>
                <BatteryBar value={device.battery_health} />
              </div>

              {device.product_model ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {device.product_model.brand} {device.product_model.model_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {device.product_model.storage} · {device.product_model.color}
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Purchase cost</p>
                  <p className="font-medium text-slate-900">{formatMoney(device.purchase_cost)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Selling price</p>
                  <p className="font-medium text-slate-900">{formatMoney(device.selling_price)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source batch</p>
                {device.source_batch ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{device.source_batch.batch_code}</p>
                    <p className="text-xs text-slate-600">Batch #{device.source_batch.id}</p>
                    <Link
                      to={`/inventory/batches/${device.source_batch.id}`}
                      className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      onClick={onClose}
                    >
                      View batch →
                    </Link>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">No batch linked</p>
                )}
              </div>

              {device.supplier ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{device.supplier.name}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
