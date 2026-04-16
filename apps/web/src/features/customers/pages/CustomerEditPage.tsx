import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { CustomerForm } from "@/features/customers/components/CustomerForm";
import { getCustomer, updateCustomer } from "@/features/customers/api";
import type { Customer } from "@/features/customers/types";
import type { CustomerFormValues } from "@/features/customers/schemas/customerFormSchema";
import { customerToFormValues, formValuesToUpdatePayload } from "@/features/customers/utils/customerFormMappers";
import { canManageCustomers } from "@/features/customers/utils/permissions";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

export default function CustomerEditPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const id = Number(customerId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = canManageCustomers(user);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId || Number.isNaN(id) || id < 1) {
      setLoadError("Invalid customer.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await getCustomer(id);
        if (!cancelled) setCustomer(data);
      } catch (e) {
        if (!cancelled) setLoadError(extractApiErrorMessage(e, "Customer not found"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, id]);

  async function handleSubmit(values: CustomerFormValues) {
    if (!canManage || !customer) return;
    setSubmitError(null);
    setSuccessMsg(null);
    try {
      await updateCustomer(customer.id, formValuesToUpdatePayload(values));
      setSuccessMsg("Customer updated successfully.");
      const refreshed = await getCustomer(customer.id);
      setCustomer(refreshed);
    } catch (e) {
      setSubmitError(extractApiErrorMessage(e, "Could not save customer"));
    }
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-950">
        <h1 className="text-lg font-semibold">Permission required</h1>
        <p className="mt-2 text-sm text-amber-900/90">Your role cannot edit customers.</p>
        <Link to="/customers" className="mt-4 inline-block text-sm font-semibold text-indigo-700 hover:underline">
          Back to customers
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" aria-hidden />
        <p className="mt-4 text-sm text-slate-600">Loading customer…</p>
      </div>
    );
  }

  if (loadError || !customer) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-900">
        <h1 className="text-lg font-semibold">Unable to load customer</h1>
        <p className="mt-2 text-sm">{loadError ?? "Unknown error."}</p>
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
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Edit customer</h1>
        <p className="mt-1 text-sm text-slate-600">{customer.business_name}</p>
      </div>

      {successMsg ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
          role="status"
        >
          {successMsg}
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {submitError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        <CustomerForm
          key={customer.id}
          mode="edit"
          defaultValues={customerToFormValues(customer)}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/customers")}
        />
      </div>
    </div>
  );
}
