import { zodResolver } from "@hookform/resolvers/zod";
import type { FormEventHandler } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { useConfirm } from "@/components/ui/confirm/useConfirm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldError } from "@/components/ui/FieldError";
import { Input, TextArea } from "@/components/ui/Input";
import { createPurchaseOrder } from "@/features/purchase-orders/api";
import { PO_STATUS_LABELS } from "@/features/purchase-orders/constants/statusLabels";
import { poCreateSchema, type PoCreateFormValues } from "@/features/purchase-orders/schemas/poCreateSchema";
import type { PurchaseOrderDetailed } from "@/features/purchase-orders/types";
import { PO_STATUSES } from "@/features/purchase-orders/types";
import { defaultPoItemRow, defaultPoCreateFormValues, poCreateFormToPayload } from "@/features/purchase-orders/utils/poCreateMappers";
import type { Supplier } from "@/features/suppliers/types";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15";
const labelClass = "text-xs font-medium text-slate-600";

type PurchaseOrderCreateFormProps = {
  suppliers: Supplier[];
  onCancel: () => void;
  onError: (msg: string | null) => void;
  onSuccess: (po: PurchaseOrderDetailed) => void;
};

export function PurchaseOrderCreateForm({ suppliers, onCancel, onError, onSuccess }: PurchaseOrderCreateFormProps) {
  const confirm = useConfirm();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PoCreateFormValues>({
    resolver: zodResolver(poCreateSchema),
    defaultValues: defaultPoCreateFormValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const submit: FormEventHandler<HTMLFormElement> = (e) => {
    void handleSubmit(async (values) => {
      onError(null);
      try {
        const po = await createPurchaseOrder(poCreateFormToPayload(values));
        onSuccess(po);
      } catch (err) {
        onError(extractApiErrorMessage(err, "Could not create purchase order"));
      }
    })(e);
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <Card className="p-6">
        <h2 className="text-base font-semibold text-slate-900">Purchase order details</h2>
        <p className="mt-1 text-sm text-slate-600">Capture supplier, schedule, and note fields before adding line items.</p>
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="po-number" className={labelClass}>
            PO number <span className="text-red-500">*</span>
          </label>
          <Input id="po-number" className="mt-1" hasError={!!errors.po_number} {...register("po_number")} />
          <FieldError>{errors.po_number?.message}</FieldError>
        </div>
        <div>
          <label htmlFor="po-supplier" className={labelClass}>
            Supplier <span className="text-red-500">*</span>
          </label>
          <select
            id="po-supplier"
            className={`mt-1 ${inputClass}`}
            {...register("supplier_id", { valueAsNumber: true })}
          >
            <option value={0}>Select supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <FieldError>{errors.supplier_id?.message}</FieldError>
        </div>
        <div>
          <label htmlFor="po-status" className={labelClass}>
            Initial status
          </label>
          <select id="po-status" className={`mt-1 ${inputClass}`} {...register("status")}>
            {PO_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PO_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="po-eta" className={labelClass}>
            Expected delivery
          </label>
          <Input id="po-eta" type="date" className="mt-1" {...register("expected_delivery_date")} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="po-notes" className={labelClass}>
            Notes
          </label>
          <TextArea id="po-notes" rows={3} className="mt-1" {...register("notes")} />
        </div>
      </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-slate-900">Line items</h2>
          <Button type="button" variant="secondary" size="sm" onClick={() => append({ ...defaultPoItemRow })}>
            + Add line
          </Button>
        </div>
        <p className="mt-1 text-xs text-slate-500">At least one product line. Unit cost is optional (used for total).</p>

        {errors.items && typeof errors.items.message === "string" ? (
          <FieldError>{errors.items.message}</FieldError>
        ) : null}

        <div className="mt-4 space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Line {index + 1}</span>
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Remove this line?",
                        message: "This product line will be removed from the draft.",
                        confirmLabel: "Remove line",
                        variant: "danger",
                      });
                      if (ok) remove(index);
                    }}
                    variant="ghost"
                    size="sm"
                    className="!px-1 !py-1 text-xs !font-medium !text-danger-700 hover:!bg-danger-50"
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={labelClass}>Brand *</label>
                  <input className={`mt-1 ${inputClass}`} {...register(`items.${index}.brand`)} />
                  <FieldError>{errors.items?.[index]?.brand?.message}</FieldError>
                </div>
                <div>
                  <label className={labelClass}>Model *</label>
                  <input className={`mt-1 ${inputClass}`} {...register(`items.${index}.model_name`)} />
                  <FieldError>{errors.items?.[index]?.model_name?.message}</FieldError>
                </div>
                <div>
                  <label className={labelClass}>Storage *</label>
                  <input className={`mt-1 ${inputClass}`} placeholder="256GB" {...register(`items.${index}.storage`)} />
                  <FieldError>{errors.items?.[index]?.storage?.message}</FieldError>
                </div>
                <div>
                  <label className={labelClass}>Color *</label>
                  <input className={`mt-1 ${inputClass}`} {...register(`items.${index}.color`)} />
                  <FieldError>{errors.items?.[index]?.color?.message}</FieldError>
                </div>
                <div>
                  <label className={labelClass}>Qty *</label>
                  <input
                    type="number"
                    min={1}
                    className={`mt-1 ${inputClass}`}
                    {...register(`items.${index}.expected_quantity`, { valueAsNumber: true })}
                  />
                  <FieldError>{errors.items?.[index]?.expected_quantity?.message}</FieldError>
                </div>
                <div>
                  <label className={labelClass}>Unit cost (USD)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={`mt-1 ${inputClass}`}
                    placeholder="0.00"
                    {...register(`items.${index}.unit_cost`)}
                  />
                  <FieldError>{errors.items?.[index]?.unit_cost?.message}</FieldError>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create purchase order"}
        </Button>
        <Button
          type="button"
          onClick={async () => {
            const ok = await confirm({
              title: "Leave without saving?",
              message: "Your purchase order draft will be discarded.",
              confirmLabel: "Leave page",
              variant: "danger",
            });
            if (ok) onCancel();
          }}
          disabled={isSubmitting}
          variant="secondary"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
