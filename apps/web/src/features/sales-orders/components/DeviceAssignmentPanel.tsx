import { useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/ui/toast/useToast";
import { DEVICE_STATUS_LABELS } from "@/features/inventory/constants/labels";
import type { DeviceDetailed } from "@/features/inventory/types";
import { statusBadgeClass } from "@/features/inventory/utils/deviceStyles";
import { bulkAddDevicesToSalesOrder } from "@/features/sales-orders/api";
import type { SalesOrderStatus } from "@/features/sales-orders/types";
import { fetchSaleableDevices } from "@/features/sales-orders/utils/saleableDevices";
import { formatMoney } from "@/features/customers/utils/formatMoney";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

const CAN_ASSIGN_STATUSES: SalesOrderStatus[] = ["draft", "confirmed", "packed"];

const inputClass =
  "w-full min-w-[6rem] rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

type DeviceAssignmentPanelProps = {
  orderId: number;
  orderStatus: SalesOrderStatus;
  assignedDeviceIds: number[];
  canManage: boolean;
  onAdded: () => void | Promise<void>;
};

export function DeviceAssignmentPanel({
  orderId,
  orderStatus,
  assignedDeviceIds,
  canManage,
  onAdded,
}: DeviceAssignmentPanelProps) {
  const toast = useToast();
  const [pool, setPool] = useState<DeviceDetailed[]>([]);
  const [loadingPool, setLoadingPool] = useState(true);
  const [poolError, setPoolError] = useState<string | null>(null);

  const [searchImei, setSearchImei] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const debouncedBrand = useDebouncedValue(brand, 300);
  const debouncedModel = useDebouncedValue(model, 300);

  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canAssign = canManage && CAN_ASSIGN_STATUSES.includes(orderStatus);

  useEffect(() => {
    if (!canAssign) {
      setLoadingPool(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingPool(true);
      setPoolError(null);
      try {
        const all = await fetchSaleableDevices();
        if (!cancelled) setPool(all);
      } catch (e) {
        if (!cancelled) setPoolError(extractApiErrorMessage(e, "Could not load devices"));
      } finally {
        if (!cancelled) setLoadingPool(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canAssign, orderId]);

  const assignedSet = useMemo(() => new Set(assignedDeviceIds), [assignedDeviceIds]);

  const filtered = useMemo(() => {
    return pool.filter((d) => {
      if (assignedSet.has(d.id)) return false;
      if (searchImei.trim() && !d.imei.includes(searchImei.trim())) return false;
      if (debouncedBrand.trim()) {
        const b = d.product_model?.brand ?? "";
        if (!b.toLowerCase().includes(debouncedBrand.trim().toLowerCase())) return false;
      }
      if (debouncedModel.trim()) {
        const m = d.product_model?.model_name ?? "";
        if (!m.toLowerCase().includes(debouncedModel.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [pool, assignedSet, searchImei, debouncedBrand, debouncedModel]);

  function getDefaultPrice(d: DeviceDetailed): string {
    if (prices[d.id] !== undefined) return prices[d.id]!;
    if (d.selling_price) return String(d.selling_price);
    return "";
  }

  function toggle(id: number, d: DeviceDetailed, checked: boolean) {
    setSelected((prev) => ({ ...prev, [id]: checked }));
    setPrices((prev) => {
      if (prev[id] !== undefined) return prev;
      if (d.selling_price) return { ...prev, [id]: String(d.selling_price) };
      return { ...prev, [id]: "" };
    });
  }

  async function handleAddSelected() {
    setFormError(null);
    const items: { device_id: number; selling_price: number }[] = [];
    for (const d of filtered) {
      if (!selected[d.id]) continue;
      const raw = prices[d.id] !== undefined ? prices[d.id]! : getDefaultPrice(d);
      const n = Number(raw);
      if (raw.trim() === "" || Number.isNaN(n) || n < 0) {
        setFormError(`Enter a valid selling price (≥ 0) for IMEI ${d.imei}.`);
        return;
      }
      items.push({ device_id: d.id, selling_price: n });
    }
    if (items.length === 0) {
      setFormError("Select at least one device with a valid price.");
      return;
    }
    setSubmitting(true);
    try {
      await bulkAddDevicesToSalesOrder(orderId, items);
      toast.success(`Added ${items.length} device(s) to the order.`);
      setSelected({});
      setPrices({});
      await onAdded();
      try {
        const refreshed = await fetchSaleableDevices();
        setPool(refreshed);
      } catch {
        /* pool refresh best-effort */
      }
    } catch (e) {
      const msg = extractApiErrorMessage(e, "Could not assign devices");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!canManage) {
    return null;
  }

  if (!canAssign) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Devices can only be assigned while the order is <strong>Draft</strong>, <strong>Confirmed</strong>, or{" "}
        <strong>Packed</strong>.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Assign devices</h2>
        <p className="mt-1 text-sm text-slate-600">
          Only devices in <strong>Available</strong> or <strong>In stock</strong> inventory can be sold. Already
          reserved or sold units are excluded from this list.
        </p>
      </div>

      <div className="space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="text-xs font-medium text-slate-600">Search IMEI</label>
            <input
              value={searchImei}
              onChange={(e) => setSearchImei(e.target.value.replace(/\D/g, ""))}
              placeholder="Digits"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Brand</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Filter"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Model</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Filter"
            />
          </div>
        </div>

        {formError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>
        ) : null}
        {poolError ? (
          <p className="text-sm text-red-600">{poolError}</p>
        ) : loadingPool ? (
          <div className="flex items-center gap-3 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span className="text-sm text-slate-600">Loading available inventory…</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200/70 bg-white/90 ring-1 ring-slate-200/35">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="border-b border-slate-100/90 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500/95">
                  <tr>
                    <th className="w-10 px-4 py-3.5 align-middle" />
                    <th className="px-4 py-3.5 align-middle">IMEI</th>
                    <th className="px-4 py-3.5 align-middle">Product</th>
                    <th className="px-4 py-3.5 align-middle">Status</th>
                    <th className="px-4 py-3.5 align-middle">List price</th>
                    <th className="min-w-[7rem] px-4 py-3.5 align-middle">Sale price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/55">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                        No matching devices available to assign.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((d) => (
                      <tr key={d.id} className="bg-white transition-colors duration-150 hover:bg-slate-50/90">
                        <td className="px-4 py-4 align-middle">
                          <input
                            type="checkbox"
                            checked={Boolean(selected[d.id])}
                            onChange={(e) => toggle(d.id, d, e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            aria-label={`Select ${d.imei}`}
                          />
                        </td>
                        <td className="px-4 py-4 align-middle font-mono text-xs text-slate-800">{d.imei}</td>
                        <td className="px-4 py-4 align-middle text-slate-700">
                          {d.product_model ? (
                            <>
                              <div className="font-medium text-slate-900">
                                {d.product_model.brand} {d.product_model.model_name}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500/95">
                                {d.product_model.storage} · {d.product_model.color}
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${statusBadgeClass(d.status)}`}
                          >
                            {DEVICE_STATUS_LABELS[d.status]}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-middle tabular-nums text-slate-600">{formatMoney(d.selling_price)}</td>
                        <td className="px-4 py-4 align-middle">
                          <input
                            type="text"
                            inputMode="decimal"
                            className={inputClass}
                            value={getDefaultPrice(d)}
                            onChange={(e) => setPrices((p) => ({ ...p, [d.id]: e.target.value }))}
                            disabled={!selected[d.id]}
                            placeholder="0.00"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                {Object.values(selected).filter(Boolean).length} device(s) selected
              </p>
              <button
                type="button"
                disabled={submitting || Object.values(selected).every((v) => !v)}
                onClick={() => void handleAddSelected()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {submitting ? "Adding…" : "Add selected to order"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
