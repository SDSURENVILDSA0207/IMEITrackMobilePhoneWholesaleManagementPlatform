import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { SupplierForm } from "@/features/suppliers/components/SupplierForm";
import { createSupplier } from "@/features/suppliers/api";
import {
  defaultSupplierFormValues,
  formValuesToPayload,
} from "@/features/suppliers/utils/supplierFormMappers";
import type { SupplierFormValues } from "@/features/suppliers/schemas/supplierFormSchema";
import { canManageSuppliers } from "@/features/suppliers/utils/permissions";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

export default function SupplierCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = canManageSuppliers(user);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(values: SupplierFormValues) {
    setSubmitError(null);
    try {
      await createSupplier(formValuesToPayload(values));
      navigate("/suppliers", { replace: false, state: { notice: "Supplier created successfully." } });
    } catch (e) {
      setSubmitError(extractApiErrorMessage(e, "Could not create supplier"));
    }
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-950">
        <h1 className="text-lg font-semibold">Permission required</h1>
        <p className="mt-2 text-sm text-amber-900/90">Your role cannot create suppliers.</p>
        <Link to="/suppliers" className="mt-4 inline-block text-sm font-semibold text-indigo-700 hover:underline">
          Back to suppliers
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/suppliers" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          ← Suppliers
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">New supplier</h1>
        <p className="mt-1 text-sm text-slate-600">Add a supplier record for purchase orders and intake.</p>
      </div>

      {submitError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {submitError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        <SupplierForm
          mode="create"
          defaultValues={defaultSupplierFormValues}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/suppliers")}
        />
      </div>
    </div>
  );
}
