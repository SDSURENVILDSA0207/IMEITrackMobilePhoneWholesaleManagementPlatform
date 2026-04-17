import { zodResolver } from "@hookform/resolvers/zod";
import type { FormEventHandler } from "react";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  type SupplierFormValues,
  supplierFormSchema,
} from "@/features/suppliers/schemas/supplierFormSchema";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldError } from "@/components/ui/FieldError";
import { Input, TextArea } from "@/components/ui/Input";
import { SUPPLIER_TYPE_LABELS, SUPPLIER_TYPES } from "@/features/suppliers/types";
import { Select } from "@/components/ui/Select";
import { formFieldLabelClass } from "@/shared/lib/formFieldClasses";

type SupplierFormProps = {
  mode: "create" | "edit";
  defaultValues: SupplierFormValues;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  disabled?: boolean;
};

export function SupplierForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  disabled = false,
}: SupplierFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues,
  });

  const submit: FormEventHandler<HTMLFormElement> = (e) => {
    void handleSubmit(async (vals) => {
      await onSubmit(vals);
    })(e);
  };

  const busy = isSubmitting || disabled;
  const primary = submitLabel ?? (mode === "create" ? "Create supplier" : "Save changes");

  const supplierTypeOptions = useMemo(
    () => SUPPLIER_TYPES.map((type) => ({ value: type, label: SUPPLIER_TYPE_LABELS[type] })),
    [],
  );

  return (
    <form onSubmit={submit} className="space-y-8">
      <Card className="grid gap-6 p-5 md:grid-cols-2 md:p-6">
        <div className="md:col-span-2">
          <label htmlFor="supplier-name" className={formFieldLabelClass}>
            Name <span className="text-red-500">*</span>
          </label>
          <Input id="supplier-name" type="text" autoComplete="organization" hasError={!!errors.name} {...register("name")} disabled={busy} />
          <FieldError>{errors.name?.message}</FieldError>
        </div>

        <div>
          <label htmlFor="supplier-contact" className={formFieldLabelClass}>
            Contact person
          </label>
          <Input id="supplier-contact" type="text" {...register("contact_person")} disabled={busy} />
        </div>

        <div>
          <label htmlFor="supplier-email" className={formFieldLabelClass}>
            Email
          </label>
          <Input id="supplier-email" type="email" autoComplete="email" hasError={!!errors.email} {...register("email")} disabled={busy} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <div>
          <label htmlFor="supplier-phone" className={formFieldLabelClass}>
            Phone
          </label>
          <Input id="supplier-phone" type="tel" autoComplete="tel" {...register("phone")} disabled={busy} />
        </div>

        <div>
          <label htmlFor="supplier-type" className={formFieldLabelClass}>
            Supplier type
          </label>
          <Controller
            name="supplier_type"
            control={control}
            render={({ field }) => (
              <Select
                id="supplier-type"
                value={field.value}
                onChange={field.onChange}
                options={supplierTypeOptions}
                disabled={busy}
              />
            )}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="supplier-address" className={formFieldLabelClass}>
            Address
          </label>
          <TextArea id="supplier-address" rows={3} {...register("address")} disabled={busy} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="supplier-payment" className={formFieldLabelClass}>
            Payment terms
          </label>
          <Input id="supplier-payment" type="text" placeholder="e.g. Net 30" {...register("payment_terms")} disabled={busy} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="supplier-notes" className={formFieldLabelClass}>
            Notes
          </label>
          <TextArea id="supplier-notes" rows={3} {...register("notes")} disabled={busy} />
        </div>

        <div className="flex items-center gap-3 md:col-span-2">
          <input id="supplier-active" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600/30" {...register("is_active")} disabled={busy} />
          <label htmlFor="supplier-active" className="text-sm font-medium text-slate-700">
            Active supplier
          </label>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : primary}
        </Button>
        <Button type="button" onClick={onCancel} disabled={busy} variant="secondary">
          Cancel
        </Button>
      </div>
    </form>
  );
}
