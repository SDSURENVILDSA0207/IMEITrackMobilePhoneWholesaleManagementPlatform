import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldError } from "@/components/ui/FieldError";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/toast/useToast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { listCustomers } from "@/features/customers/api";
import type { Customer } from "@/features/customers/types";
import { createSalesOrder } from "@/features/sales-orders/api";
import { SO_STATUS_LABELS } from "@/features/sales-orders/constants/statusLabels";
import { soCreateSchema, type SoCreateFormValues } from "@/features/sales-orders/schemas/soCreateSchema";
import { SALES_ORDER_STATUSES } from "@/features/sales-orders/types";
import { defaultSoCreateValues, soCreateFormToPayload } from "@/features/sales-orders/utils/soCreateMappers";
import { canManageSalesOrders } from "@/features/sales-orders/utils/permissions";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { formFieldInputClass, formFieldLabelClass } from "@/shared/lib/formFieldClasses";

export default function SalesOrderCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const canManage = canManageSalesOrders(user);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SoCreateFormValues>({
    resolver: zodResolver(soCreateSchema),
    defaultValues: defaultSoCreateValues,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listCustomers({ activeOnly: true });
        if (!cancelled) setCustomers(data);
      } catch (e) {
        if (!cancelled) setLoadError(extractApiErrorMessage(e, "Failed to load customers"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-950">
        <h1 className="text-lg font-semibold">Permission required</h1>
        <p className="mt-2 text-sm text-amber-900/90">Your role cannot create sales orders.</p>
        <Link to="/sales-orders" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
          Back to sales orders
        </Link>
      </div>
    );
  }

  return (
    <PageContainer className="mx-auto max-w-2xl">
      <div>
        <Link to="/sales-orders" className="text-sm font-medium text-brand-700 hover:text-brand-600">
          ← Sales orders
        </Link>
        <div className="mt-3">
          <PageHeader title="New sales order" description="Choose a customer, then assign devices on the next screen." eyebrow="Sales Orders" />
        </div>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>
      ) : null}

      {customers.length === 0 && !loadError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add at least one active customer before creating a sales order.
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {submitError}
        </div>
      ) : null}

      {customers.length > 0 ? (
        <Card
          className="p-6 md:p-8"
          interactive
        >
        <form
          onSubmit={handleSubmit(async (values) => {
            setSubmitError(null);
            try {
              const order = await createSalesOrder(soCreateFormToPayload(values));
              toast.success("Sales order created. Assign devices on the next screen.");
              navigate(`/sales-orders/${order.id}`, {
                replace: true,
                state: { notice: "Sales order created. Assign devices below." },
              });
            } catch (e) {
              const msg = extractApiErrorMessage(e, "Could not create sales order");
              setSubmitError(msg);
              toast.error(msg);
            }
          })}
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="so-order-number" className={formFieldLabelClass}>
                Order number <span className="text-red-500">*</span>
              </label>
              <input id="so-order-number" className={formFieldInputClass} {...register("order_number")} />
              <FieldError>{errors.order_number?.message}</FieldError>
            </div>
            <div>
              <label htmlFor="so-customer" className={formFieldLabelClass}>
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                id="so-customer"
                className={formFieldInputClass}
                {...register("customer_id", { valueAsNumber: true })}
              >
                <option value={0}>Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.business_name}
                  </option>
                ))}
              </select>
              <FieldError>{errors.customer_id?.message}</FieldError>
            </div>
            <div>
              <label htmlFor="so-status" className={formFieldLabelClass}>
                Initial status
              </label>
              <select id="so-status" className={formFieldInputClass} {...register("status")}>
                {SALES_ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {SO_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="so-notes" className={formFieldLabelClass}>
                Notes
              </label>
              <textarea id="so-notes" rows={3} className={formFieldInputClass} {...register("notes")} />
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create & continue"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/sales-orders")}>
              Cancel
            </Button>
          </div>
        </form>
        </Card>
      ) : null}
    </PageContainer>
  );
}
