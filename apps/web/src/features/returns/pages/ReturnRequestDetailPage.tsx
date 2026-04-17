import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { textLinkClass } from "@/components/ui/linkStyles";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/PageSpinner";
import { useToast } from "@/components/ui/toast/useToast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getReturnRequest, updateReturnRequestStatus } from "@/features/returns/api";
import { RmaStatusBadge } from "@/features/returns/components/RmaStatusBadge";
import { RMA_STATUS_LABELS } from "@/features/returns/constants/statusLabels";
import type { ReturnRequestDetailed, ReturnRequestStatus } from "@/features/returns/types";
import { RETURN_REQUEST_STATUSES } from "@/features/returns/types";
import { canUpdateReturnStatus } from "@/features/returns/utils/permissions";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { Select } from "@/components/ui/Select";
import { formFieldInputClass } from "@/shared/lib/formFieldClasses";

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function ReturnRequestDetailPage() {
  const { returnId } = useParams<{ returnId: string }>();
  const id = Number(returnId);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const canUpdateStatus = canUpdateReturnStatus(user);

  const [ret, setRet] = useState<ReturnRequestDetailed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [statusDraft, setStatusDraft] = useState<ReturnRequestStatus>("requested");
  const [resolutionDraft, setResolutionDraft] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);

  const rmaStatusOptions = useMemo(
    () => RETURN_REQUEST_STATUSES.map((s) => ({ value: s, label: RMA_STATUS_LABELS[s] })),
    [],
  );

  useEffect(() => {
    const state = location.state as { notice?: string } | null;
    if (state?.notice) {
      setFlash(state.notice);
      navigate(".", { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!returnId || Number.isNaN(id) || id < 1) {
      setError("Invalid return request.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getReturnRequest(id);
        if (!cancelled) {
          setRet(data);
          setStatusDraft(data.status);
          setResolutionDraft(data.resolution_notes ?? "");
        }
      } catch (e) {
        if (!cancelled) setError(extractApiErrorMessage(e, "Return request not found"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [returnId, id]);

  async function handleStatusSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ret || !canUpdateStatus) return;
    setStatusErr(null);
    setStatusMsg(null);
    setStatusSaving(true);
    try {
      const payload: { status: ReturnRequestStatus; resolution_notes?: string | null } = {
        status: statusDraft,
      };
      const trimmed = resolutionDraft.trim();
      if (trimmed !== (ret.resolution_notes ?? "").trim()) {
        payload.resolution_notes = trimmed || null;
      }
      const updated = await updateReturnRequestStatus(ret.id, payload);
      setRet(updated);
      setResolutionDraft(updated.resolution_notes ?? "");
      setStatusMsg("Return updated.");
      toast.success("Return request updated.");
    } catch (err) {
      const msg = extractApiErrorMessage(err, "Could not update return");
      setStatusErr(msg);
      toast.error(msg);
    } finally {
      setStatusSaving(false);
    }
  }

  if (loading) {
    return <PageSpinner label="Loading return request…" />;
  }

  if (error || !ret) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-900">
        <h1 className="text-lg font-semibold">Unable to load return</h1>
        <p className="mt-2 text-sm">{error ?? "Unknown error."}</p>
        <Link to="/returns" className={`mt-4 inline-block text-sm font-semibold ${textLinkClass}`}>
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <PageContainer className="mx-auto max-w-4xl">
      <div>
        <Link to="/returns" className={`text-sm font-medium ${textLinkClass}`}>
          ← Returns / RMA
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <PageHeader title={`Return #${ret.id}`} eyebrow="Returns / RMA" />
            <div className="mt-2">
              <RmaStatusBadge status={ret.status} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Opened {formatWhen(ret.created_at)}
              {ret.processed_at ? ` · Processed ${formatWhen(ret.processed_at)}` : null}
            </p>
          </div>
        </div>
      </div>

      {flash ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
          role="status"
        >
          {flash}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Sales order</h2>
            <p className="mt-3 text-sm text-slate-800">
              {ret.sales_order ? (
                <Link
                  to={`/sales-orders/${ret.sales_order.id}`}
                  className={`${textLinkClass} font-semibold`}
                >
                  {ret.sales_order.order_number}
                </Link>
              ) : (
                <span>Order #{ret.sales_order_id}</span>
              )}
            </p>
            {ret.sales_order ? (
              <p className="mt-1 text-xs capitalize text-slate-500">Order status: {ret.sales_order.status}</p>
            ) : null}
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Device</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <dt className="text-slate-500">IMEI</dt>
                <dd className="font-mono text-xs text-slate-900">{ret.device?.imei ?? `Device #${ret.device_id}`}</dd>
              </div>
              {ret.device ? (
                <div className="flex flex-wrap gap-2">
                  <dt className="text-slate-500">Device status</dt>
                  <dd className="capitalize text-slate-800">{ret.device.status.replace("_", " ")}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Reason &amp; description</h2>
            <div className="mt-3 space-y-3 text-sm text-slate-800">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reason</p>
                <p className="mt-1 whitespace-pre-wrap">{ret.reason ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Issue description</p>
                <p className="mt-1 whitespace-pre-wrap">{ret.issue_description ?? "—"}</p>
              </div>
            </div>
          </Card>

          {ret.resolution_notes && !canUpdateStatus ? (
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-900">Resolution notes</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{ret.resolution_notes}</p>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-6">
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1">
                  <RmaStatusBadge status={ret.status} />
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Processed</dt>
                <dd className="mt-1 text-slate-800">{formatWhen(ret.processed_at)}</dd>
              </div>
            </dl>
          </Card>

          {canUpdateStatus ? (
            <Card className="p-6">
            <form onSubmit={handleStatusSubmit}>
              <h2 className="text-sm font-semibold text-slate-900">Update status</h2>
              <p className="mt-1 text-xs text-slate-500">Admin and inventory roles can move this return through resolution.</p>

              <label className="mt-4 block text-xs font-medium text-slate-600" htmlFor="rma-status">
                Status
              </label>
              <div className="max-w-xs">
                <Select
                  id="rma-status"
                  value={statusDraft}
                  onChange={(v) => setStatusDraft(v as ReturnRequestStatus)}
                  options={rmaStatusOptions}
                />
              </div>

              <label className="mt-4 block text-xs font-medium text-slate-600" htmlFor="resolution_notes">
                Resolution notes
              </label>
              <textarea
                id="resolution_notes"
                rows={4}
                className={formFieldInputClass}
                value={resolutionDraft}
                onChange={(e) => setResolutionDraft(e.target.value)}
                placeholder="Internal notes (refund ID, replacement serial, repair ticket, …)"
              />

              {statusErr ? (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {statusErr}
                </p>
              ) : null}
              {statusMsg ? <p className="mt-2 text-sm text-emerald-700">{statusMsg}</p> : null}

              <Button type="submit" disabled={statusSaving} className="mt-4 w-full">
                {statusSaving ? "Saving…" : "Save"}
              </Button>
            </form>
            </Card>
          ) : null}
        </aside>
      </div>
    </PageContainer>
  );
}
