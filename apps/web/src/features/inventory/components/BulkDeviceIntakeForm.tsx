import { type FormEvent, useMemo, useState } from "react";

import { Select } from "@/components/ui/Select";
import { bulkAddDevicesToBatch } from "@/features/inventory/api";
import { CONDITION_LABELS, DEVICE_STATUS_LABELS, LOCK_STATUS_LABELS } from "@/features/inventory/constants/labels";
import type {
  DeviceConditionGrade,
  DeviceLockStatus,
  DeviceStatus,
  IntakeDevicePayload,
  ProductModel,
} from "@/features/inventory/types";
import {
  DEVICE_CONDITION_GRADES,
  DEVICE_LOCK_STATUSES,
  DEVICE_STATUSES,
} from "@/features/inventory/types";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { formFieldInputClass } from "@/shared/lib/formFieldClasses";

type BulkDeviceIntakeFormProps = {
  batchId: number;
  productModels: ProductModel[];
  onSuccess: () => void;
};

export function BulkDeviceIntakeForm({ batchId, productModels, onSuccess }: BulkDeviceIntakeFormProps) {
  const [imeiBlock, setImeiBlock] = useState("");
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
    const lines = imeiBlock
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setError("Enter at least one IMEI (one per line).");
      return;
    }
    const bh = Number(batteryHealth);
    if (Number.isNaN(bh) || bh < 0 || bh > 100) {
      setError("Battery health must be 0–100.");
      return;
    }
    for (const line of lines) {
      if (!/^\d{14,32}$/.test(line)) {
        setError(`Invalid IMEI (digits only, 14–32 chars): ${line}`);
        return;
      }
    }
    const pc = purchaseCost.trim() === "" ? null : Number(purchaseCost);
    const sp = sellingPrice.trim() === "" ? null : Number(sellingPrice);
    if (pc !== null && Number.isNaN(pc)) {
      setError("Invalid purchase cost.");
      return;
    }
    if (sp !== null && Number.isNaN(sp)) {
      setError("Invalid selling price.");
      return;
    }
    const pmId = Number(productModelId);
    const devices: IntakeDevicePayload[] = lines.map((imei) => ({
      imei,
      product_model_id: pmId,
      condition_grade: conditionGrade,
      battery_health: bh,
      lock_status: lockStatus,
      status: deviceStatus,
      purchase_cost: pc,
      selling_price: sp,
    }));
    setSubmitting(true);
    try {
      const created = await bulkAddDevicesToBatch(batchId, { devices });
      setSuccess(`Added ${created.length} device(s) to batch.`);
      setImeiBlock("");
      onSuccess();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Bulk intake failed"));
    } finally {
      setSubmitting(false);
    }
  }

  const productModelOptions = useMemo(
    () => [
      { value: "", label: "Select…" },
      ...productModels.map((m) => ({
        value: String(m.id),
        label: `${m.brand} ${m.model_name} (${m.storage}, ${m.color})`,
      })),
    ],
    [productModels],
  );

  const conditionOptions = useMemo(
    () => DEVICE_CONDITION_GRADES.map((g) => ({ value: g, label: CONDITION_LABELS[g] })),
    [],
  );

  const lockOptions = useMemo(
    () => DEVICE_LOCK_STATUSES.map((s) => ({ value: s, label: LOCK_STATUS_LABELS[s] })),
    [],
  );

  const deviceStatusOptions = useMemo(
    () => DEVICE_STATUSES.map((s) => ({ value: s, label: DEVICE_STATUS_LABELS[s] })),
    [],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-100 pt-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Bulk intake</h3>
        <p className="mt-1 text-xs text-slate-500">
          Same product model and grading for every IMEI. One IMEI per line ({`14–32`} digits).
        </p>
      </div>
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

      <div>
        <label className="block text-xs font-medium text-slate-600">IMEIs (one per line)</label>
        <textarea
          value={imeiBlock}
          onChange={(e) => setImeiBlock(e.target.value)}
          rows={6}
          className={`${formFieldInputClass} font-mono text-xs`}
          placeholder={"353456789012345\n353456789012346"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600">Product model</label>
          <Select
            value={productModelId}
            onChange={setProductModelId}
            options={productModelOptions}
            placeholder="Select…"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Condition</label>
          <Select
            value={conditionGrade}
            onChange={(v) => setConditionGrade(v as DeviceConditionGrade)}
            options={conditionOptions}
          />
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
          <Select
            value={lockStatus}
            onChange={(v) => setLockStatus(v as DeviceLockStatus)}
            options={lockOptions}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Device status</label>
          <Select
            value={deviceStatus}
            onChange={(v) => setDeviceStatus(v as DeviceStatus)}
            options={deviceStatusOptions}
          />
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
        className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-100 disabled:opacity-60"
      >
        {submitting ? "Importing…" : "Import devices"}
      </button>
    </form>
  );
}
