import { zodResolver } from "@hookform/resolvers/zod";
import type { FormEventHandler } from "react";
import { useForm } from "react-hook-form";

import {
  type CustomerFormValues,
  customerFormSchema,
} from "@/features/customers/schemas/customerFormSchema";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldError } from "@/components/ui/FieldError";
import { Input, TextArea } from "@/components/ui/Input";
import { formFieldLabelClass } from "@/shared/lib/formFieldClasses";

type CustomerFormProps = {
  mode: "create" | "edit";
  defaultValues: CustomerFormValues;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  disabled?: boolean;
};

export function CustomerForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  disabled = false,
}: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  });

  const submit: FormEventHandler<HTMLFormElement> = (e) => {
    void handleSubmit(async (vals) => {
      await onSubmit(vals);
    })(e);
  };

  const busy = isSubmitting || disabled;
  const primary = submitLabel ?? (mode === "create" ? "Create customer" : "Save changes");

  return (
    <form onSubmit={submit} className="space-y-8">
      <Card className="grid gap-6 p-5 md:grid-cols-2 md:p-6">
        <div className="md:col-span-2">
          <label htmlFor="customer-business" className={formFieldLabelClass}>
            Business name <span className="text-red-500">*</span>
          </label>
          <Input
            id="customer-business"
            type="text"
            autoComplete="organization"
            hasError={!!errors.business_name}
            {...register("business_name")}
            disabled={busy}
          />
          <FieldError>{errors.business_name?.message}</FieldError>
        </div>

        <div>
          <label htmlFor="customer-contact" className={formFieldLabelClass}>
            Contact person
          </label>
          <Input id="customer-contact" type="text" {...register("contact_person")} disabled={busy} />
        </div>

        <div>
          <label htmlFor="customer-email" className={formFieldLabelClass}>
            Email
          </label>
          <Input id="customer-email" type="email" autoComplete="email" hasError={!!errors.email} {...register("email")} disabled={busy} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <div>
          <label htmlFor="customer-phone" className={formFieldLabelClass}>
            Phone
          </label>
          <Input id="customer-phone" type="tel" autoComplete="tel" {...register("phone")} disabled={busy} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="customer-billing" className={formFieldLabelClass}>
            Billing address
          </label>
          <TextArea id="customer-billing" rows={2} {...register("billing_address")} disabled={busy} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="customer-shipping" className={formFieldLabelClass}>
            Shipping address
          </label>
          <TextArea id="customer-shipping" rows={2} {...register("shipping_address")} disabled={busy} />
        </div>

        <div>
          <label htmlFor="customer-credit" className={formFieldLabelClass}>
            Credit limit (USD)
          </label>
          <Input
            id="customer-credit"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            hasError={!!errors.credit_limit}
            {...register("credit_limit")}
            disabled={busy}
          />
          <FieldError>{errors.credit_limit?.message}</FieldError>
        </div>

        <div>
          <label htmlFor="customer-balance" className={formFieldLabelClass}>
            Outstanding balance (USD)
          </label>
          <Input
            id="customer-balance"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            hasError={!!errors.outstanding_balance}
            {...register("outstanding_balance")}
            disabled={busy}
          />
          <FieldError>{errors.outstanding_balance?.message}</FieldError>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="customer-notes" className={formFieldLabelClass}>
            Notes
          </label>
          <TextArea id="customer-notes" rows={3} {...register("notes")} disabled={busy} />
        </div>

        <div className="flex items-center gap-3 md:col-span-2">
          <input
            id="customer-active"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600/30"
            {...register("is_active")}
            disabled={busy}
          />
          <label htmlFor="customer-active" className="text-sm font-medium text-slate-700">
            Active customer
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
