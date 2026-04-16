import { type FormEvent, useState } from "react";

import { addDeviceToBatch } from "@/features/inventory/api";
import { CONDITION_LABELS, DEVICE_STATUS_LABELS, LOCK_STATUS_LABELS } from "@/features/inventory/constants/labels";
import type { DeviceConditionGrade, DeviceLockStatus, DeviceStatus, ProductModel } from "@/features/inventory/types";
import {
  DEVICE_CONDITION_GRADES,
  DEVICE_LOCK_STATUSES,
  DEVICE_STATUSES,
} from "@/features/inventory/types";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { formFieldInputClass } from "@/shared/lib/formFieldClasses";

type AddDeviceToBatchFormProps = {
  batchId: number;
  productModels: ProductModel[];
  onSuccess: () => void;
};

export function AddDeviceToBatchForm({ batchId, productModels, onSuccess }: AddDeviceToBatchFormProps) {
  const [imei, setImei] = useState("");
  const [productModelId, setProductModelId] = useState("");
  const [conditionGrade, setConditionGrade] = useState<DeviceConditionGrade>("A");
  const [batteryHealth, setBatteryHealth] = useState("100");
  const [lockStatus, setLockStatus] = useState<DeviceLockStatus>("unlocked");
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>("available");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!productModelId) {
      setError("Select a product model.");
      return;
    }
    const bh = Number(batteryHealth);
    if (Number.isNaN(bh) || bh < 0 || bh > 100) {
      setError("Battery health must be 0–100.");
      return;
    }
    setSubmitting(true);
    try {
      await addDeviceToBatch(batchId, {
        imei: imei.trim(),
        product_model_id: Number(productModelId),
        condition_grade: conditionGrade,
        battery_health: bh,
        lock_status: lockStatus,
        status: deviceStatus,
        purchase_cost: purchaseCost.trim() === "" ? null : Number(purchaseCost),
        selling_price: sellingPrice.trim() === "" ? null : Number(sellingPrice),
      });
      setSuccess("Device added to batch.");
      setImei("");
      onSuccess();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not add device"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">Add single device</h3>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm font-medium text-emerald-800" role="status">
          {success}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600">IMEI (digits only)</label>
          <input
            value={imei}
            onChange={(e) => setImei(e.target.value.replace(/\D/g, ""))}
            className={formFieldInputClass}
            maxLength={32}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600">Product model</label>
          <select
            value={productModelId}
            onChange={(e) => setProductModelId(e.target.value)}
            className={formFieldInputClass}
            required
          >
            <option value="">Select…</option>
            {productModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.brand} {m.model_name} ({m.storage}, {m.color})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Condition</label>
          <select
            value={conditionGrade}
            onChange={(e) => setConditionGrade(e.target.value as DeviceConditionGrade)}
            className={formFieldInputClass}
          >
            {DEVICE_CONDITION_GRADES.map((g) => (
              <option key={g} value={g}>
                {CONDITION_LABELS[g]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Battery health %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={batteryHealth}
            onChange={(e) => setBatteryHealth(e.target.value)}
            className={formFieldInputClass}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Lock status</label>
          <select
            value={lockStatus}
            onChange={(e) => setLockStatus(e.target.value as DeviceLockStatus)}
            className={formFieldInputClass}
          >
            {DEVICE_LOCK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LOCK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Device status</label>
          <select
            value={deviceStatus}
            onChange={(e) => setDeviceStatus(e.target.value as DeviceStatus)}
            className={formFieldInputClass}
          >
            {DEVICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {DEVICE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Purchase cost (optional)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={purchaseCost}
            onChange={(e) => setPurchaseCost(e.target.value)}
            className={formFieldInputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Selling price (optional)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            className={formFieldInputClass}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {submitting ? "Adding…" : "Add device"}
      </button>
    </form>
  );
}
