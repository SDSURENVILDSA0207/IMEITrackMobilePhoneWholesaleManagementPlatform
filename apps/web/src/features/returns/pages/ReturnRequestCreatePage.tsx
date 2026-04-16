import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { createReturnRequest, listReturnRequests } from "@/features/returns/api";
import { rmaCreateSchema, type RmaCreateFormValues } from "@/features/returns/schemas/rmaCreateSchema";
import { getSalesOrder } from "@/features/sales-orders/api";
import type { SalesOrder, SalesOrderDetailed } from "@/features/sales-orders/types";
import { canCreateReturnRequest } from "@/features/returns/utils/permissions";
import { fetchEligibleSalesOrdersForRma } from "@/features/returns/utils/eligibleSalesOrders";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { formFieldInputClass, formFieldLabelClass } from "@/shared/lib/formFieldClasses";

const selectClass = `${formFieldInputClass} max-w-xl`;

export default function ReturnRequestCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = canCreateReturnRequest(user);

  const [eligibleOrders, setEligibleOrders] = useState<SalesOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDetail, setOrderDetail] = useState<SalesOrderDetailed | null>(null);
  const [orderLoadError, setOrderLoadError] = useState<string | null>(null);
  const [blockedDeviceIds, setBlockedDeviceIds] = useState<Set<number>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RmaCreateFormValues>({
    resolver: zodResolver(rmaCreateSchema),
    defaultValues: {
      sales_order_id: 0,
      device_id: 0,
      reason: "",
      issue_description: "",
    },
  });

  const salesOrderId = watch("sales_order_id");
  const deviceId = watch("device_id");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const data = await fetchEligibleSalesOrdersForRma();
        if (!cancelled) setEligibleOrders(data);
      } catch (e) {
        if (!cancelled) setOrdersError(extractApiErrorMessage(e, "Failed to load eligible sales orders"));
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [req, appr] = await Promise.all([
          listReturnRequests({ status: "requested" }),
          listReturnRequests({ status: "approved" }),
        ]);
        if (!cancelled) {
          const s = new Set<number>();
          for (const r of [...req, ...appr]) s.add(r.device_id);
          setBlockedDeviceIds(s);
        }
      } catch {
        /* non-blocking */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!salesOrderId || salesOrderId < 1) {
      setOrderDetail(null);
      setOrderLoadError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setOrderLoadError(null);
      try {
        const o = await getSalesOrder(salesOrderId);
        if (!cancelled) setOrderDetail(o);
      } catch (e) {
        if (!cancelled) setOrderLoadError(extractApiErrorMessage(e, "Could not load sales order"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [salesOrderId]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return eligibleOrders;
    return eligibleOrders.filter(
      (o) => o.order_number.toLowerCase().includes(q) || String(o.id).includes(q),
    );
  }, [eligibleOrders, orderSearch]);

  if (!canCreate) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-950">
        <h1 className="text-lg font-semibold">Permission required</h1>
        <p className="mt-2 text-sm text-amber-900/90">Your role cannot create return requests.</p>
        <Link to="/returns" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
          Back to returns
        </Link>
      </div>
    );
  }

  return (
    <PageContainer className="mx-auto max-w-3xl">
      <div>
        <Link to="/returns" className="text-sm font-medium text-brand-700 hover:text-brand-600">
          ← Returns / RMA
        </Link>
        <div className="mt-3">
          <PageHeader
            title="New return request"
            description="Choose a shipped or delivered order, select the device being returned, and describe the issue."
            eyebrow="Returns / RMA"
          />
        </div>
      </div>

      {ordersError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{ordersError}</div>
      ) : null}

      {submitError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {submitError}
        </div>
      ) : null}

      <form
        className="space-y-8"
        onSubmit={handleSubmit(async (values) => {
          setSubmitError(null);
          try {
            const created = await createReturnRequest({
              sales_order_id: values.sales_order_id,
              device_id: values.device_id,
              reason: values.reason.trim(),
              issue_description: values.issue_description.trim(),
              status: "requested",
            });
            navigate(`/returns/${created.id}`, {
              replace: true,
              state: { notice: "Return request created." },
            });
          } catch (e) {
            setSubmitError(extractApiErrorMessage(e, "Could not create return request"));
          }
        })}
      >
        <Card className="p-6 md:p-8">
          <h2 className="text-sm font-semibold text-slate-900">Sales order</h2>
          <p className="mt-1 text-sm text-slate-600">
            Search by order number or ID. Only orders that are already shipped or delivered are listed.
          </p>

          <div className="mt-4">
            <label className={formFieldLabelClass} htmlFor="orderSearch">
              Search
            </label>
            <input
              id="orderSearch"
              type="search"
              className={formFieldInputClass}
              placeholder="e.g. SO-2024 or order ID"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              disabled={ordersLoading}
            />
          </div>

          <div className="mt-4">
            <label className={formFieldLabelClass} htmlFor="sales_order_id">
              Order
            </label>
            <select
              id="sales_order_id"
              className={selectClass}
              disabled={ordersLoading || filteredOrders.length === 0}
              value={salesOrderId > 0 ? String(salesOrderId) : ""}
              onChange={(e) => {
                const raw = e.target.value;
                const id = raw === "" ? 0 : Number(raw);
                setValue("sales_order_id", id, { shouldValidate: true });
                setValue("device_id", 0, { shouldValidate: true });
              }}
            >
              <option value="">
                {ordersLoading ? "Loading orders…" : "Select a sales order…"}
              </option>
              {filteredOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_number} · #{o.id} · {o.status}
                </option>
              ))}
            </select>
            {errors.sales_order_id ? (
              <p className="mt-1 text-sm text-red-600">{errors.sales_order_id.message}</p>
            ) : null}
          </div>

          {orderLoadError ? (
            <p className="mt-3 text-sm text-red-600">{orderLoadError}</p>
          ) : null}
        </Card>

        {orderDetail ? (
          <Card className="p-6 md:p-8">
            <h2 className="text-sm font-semibold text-slate-900">Device</h2>
            <p className="mt-1 text-sm text-slate-600">
              Select one line item. Only devices that are still marked sold and without an open return can be chosen.
            </p>

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50/90">
                  <tr>
                    <th className="w-10 px-3 py-2" scope="col" />
                    <th className="px-3 py-2 font-semibold text-slate-700">IMEI</th>
                    <th className="px-3 py-2 font-semibold text-slate-700">Status</th>
                    <th className="px-3 py-2 font-semibold text-slate-700">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orderDetail.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                        This order has no line items.
                      </td>
                    </tr>
                  ) : (
                    orderDetail.items.map((it) => {
                      const d = it.device;
                      let note = "";
                      let disabled = true;
                      if (!d) {
                        note = "Device record missing";
                      } else if (d.status !== "sold") {
                        note = `Device is ${d.status.replace("_", " ")}`;
                      } else if (blockedDeviceIds.has(d.id)) {
                        note = "Open return already exists";
                      } else {
                        disabled = false;
                      }
                      return (
                        <tr key={it.id} className={disabled ? "bg-slate-50/80 text-slate-500" : ""}>
                          <td className="px-3 py-2 align-middle">
                            <input
                              type="radio"
                              name="device_pick"
                              className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-600/40"
                              checked={deviceId === it.device_id}
                              disabled={disabled}
                              onChange={() => setValue("device_id", it.device_id, { shouldValidate: true })}
                              aria-label={`Select device ${d?.imei ?? it.device_id}`}
                            />
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">{d?.imei ?? `Device #${it.device_id}`}</td>
                          <td className="px-3 py-2 capitalize">{d?.status?.replace("_", " ") ?? "—"}</td>
                          <td className="px-3 py-2 text-xs">{note || "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {errors.device_id ? <p className="mt-2 text-sm text-red-600">{errors.device_id.message}</p> : null}
          </Card>
        ) : null}

        <Card className="p-6 md:p-8">
          <h2 className="text-sm font-semibold text-slate-900">Reason &amp; details</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className={formFieldLabelClass} htmlFor="reason">
                Return reason
              </label>
              <input id="reason" type="text" className={formFieldInputClass} {...register("reason")} placeholder="e.g. Defective screen" />
              {errors.reason ? <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p> : null}
            </div>
            <div>
              <label className={formFieldLabelClass} htmlFor="issue_description">
                Issue description
              </label>
              <textarea
                id="issue_description"
                rows={5}
                className={formFieldInputClass}
                {...register("issue_description")}
                placeholder="Describe symptoms, when the issue appeared, and any troubleshooting already done."
              />
              {errors.issue_description ? (
                <p className="mt-1 text-sm text-red-600">{errors.issue_description.message}</p>
              ) : null}
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit return request"}
          </Button>
          <Link to="/returns" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Cancel
          </Link>
        </div>
      </form>
    </PageContainer>
  );
}
