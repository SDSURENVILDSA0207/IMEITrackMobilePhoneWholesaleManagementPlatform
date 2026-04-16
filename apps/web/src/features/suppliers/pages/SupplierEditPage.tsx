import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { SupplierForm } from "@/features/suppliers/components/SupplierForm";
import { getSupplier, updateSupplier } from "@/features/suppliers/api";
import { supplierToFormValues, formValuesToPayload } from "@/features/suppliers/utils/supplierFormMappers";
import type { Supplier } from "@/features/suppliers/types";
import type { SupplierFormValues } from "@/features/suppliers/schemas/supplierFormSchema";
import { canManageSuppliers } from "@/features/suppliers/utils/permissions";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

export default function SupplierEditPage() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const id = Number(supplierId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = canManageSuppliers(user);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!supplierId || Number.isNaN(id) || id < 1) {
      setLoadError("Invalid supplier.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await getSupplier(id);
        if (!cancelled) setSupplier(data);
      } catch (e) {
        if (!cancelled) setLoadError(extractApiErrorMessage(e, "Supplier not found"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supplierId, id]);

  async function handleSubmit(values: SupplierFormValues) {
    if (!canManage || !supplier) return;
    setSubmitError(null);
    setSuccessMsg(null);
    try {
      await updateSupplier(supplier.id, formValuesToPayload(values));
      setSuccessMsg("Supplier updated successfully.");
      const refreshed = await getSupplier(supplier.id);
      setSupplier(refreshed);
    } catch (e) {
      setSubmitError(extractApiErrorMessage(e, "Could not save supplier"));
    }
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-950">
        <h1 className="text-lg font-semibold">Permission required</h1>
        <p className="mt-2 text-sm text-amber-900/90">Your role cannot edit suppliers.</p>
        <Link to="/suppliers" className="mt-4 inline-block text-sm font-semibold text-indigo-700 hover:underline">
          Back to suppliers
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" aria-hidden />
        <p className="mt-4 text-sm text-slate-600">Loading supplier…</p>
      </div>
    );
  }

  if (loadError || !supplier) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-900">
        <h1 className="text-lg font-semibold">Unable to load supplier</h1>
        <p className="mt-2 text-sm">{loadError ?? "Unknown error."}</p>
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
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Edit supplier</h1>
        <p className="mt-1 text-sm text-slate-600">{supplier.name}</p>
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
        <SupplierForm
          key={supplier.id}
          mode="edit"
          defaultValues={supplierToFormValues(supplier)}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/suppliers")}
        />
      </div>
    </div>
  );
}
