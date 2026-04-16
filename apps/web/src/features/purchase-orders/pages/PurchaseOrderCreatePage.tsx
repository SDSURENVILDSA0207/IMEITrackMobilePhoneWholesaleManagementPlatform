import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { textLinkClass } from "@/components/ui/linkStyles";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PurchaseOrderCreateForm } from "@/features/purchase-orders/components/PurchaseOrderCreateForm";
import { listSuppliers } from "@/features/suppliers/api";
import type { Supplier } from "@/features/suppliers/types";
import { canManagePurchaseOrders } from "@/features/purchase-orders/utils/permissions";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = canManagePurchaseOrders(user);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listSuppliers({ activeOnly: true });
        if (!cancelled) setSuppliers(data);
      } catch (e) {
        if (!cancelled) setLoadError(extractApiErrorMessage(e, "Failed to load suppliers"));
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
        <p className="mt-2 text-sm text-amber-900/90">Only procurement roles can create purchase orders.</p>
        <Link to="/purchase-orders" className={`mt-4 inline-block text-sm font-semibold ${textLinkClass}`}>
          Back to purchase orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link to="/purchase-orders" className={`text-sm font-medium ${textLinkClass}`}>
          ← Purchase orders
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">New purchase order</h1>
        <p className="mt-1 text-sm text-slate-600">Link to a supplier and add one or more product lines.</p>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>
      ) : null}

      {formError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {formError}
        </div>
      ) : null}

      {suppliers.length === 0 && !loadError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add at least one active supplier before creating a PO.
        </div>
      ) : null}

      {suppliers.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <PurchaseOrderCreateForm
            suppliers={suppliers}
            onCancel={() => navigate("/purchase-orders")}
            onError={setFormError}
            onSuccess={(po) =>
              navigate(`/purchase-orders/${po.id}`, {
                replace: true,
                state: { notice: "Purchase order created successfully." },
              })
            }
          />
        </div>
      ) : null}
    </div>
  );
}
