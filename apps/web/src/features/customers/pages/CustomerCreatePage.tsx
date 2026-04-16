import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { CustomerForm } from "@/features/customers/components/CustomerForm";
import { createCustomer } from "@/features/customers/api";
import type { CustomerFormValues } from "@/features/customers/schemas/customerFormSchema";
import { defaultCustomerFormValues, formValuesToCreatePayload } from "@/features/customers/utils/customerFormMappers";
import { canManageCustomers } from "@/features/customers/utils/permissions";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

export default function CustomerCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = canManageCustomers(user);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(values: CustomerFormValues) {
    setSubmitError(null);
    try {
      await createCustomer(formValuesToCreatePayload(values));
      navigate("/customers", { replace: false, state: { notice: "Customer created successfully." } });
    } catch (e) {
      setSubmitError(extractApiErrorMessage(e, "Could not create customer"));
    }
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-950">
        <h1 className="text-lg font-semibold">Permission required</h1>
        <p className="mt-2 text-sm text-amber-900/90">Your role cannot create customers.</p>
        <Link to="/customers" className="mt-4 inline-block text-sm font-semibold text-indigo-700 hover:underline">
          Back to customers
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/customers" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          ← Customers
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">New customer</h1>
        <p className="mt-1 text-sm text-slate-600">Add a B2B account for quotes and sales orders.</p>
      </div>

      {submitError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {submitError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        <CustomerForm
          mode="create"
          defaultValues={defaultCustomerFormValues}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/customers")}
        />
      </div>
    </div>
  );
}
