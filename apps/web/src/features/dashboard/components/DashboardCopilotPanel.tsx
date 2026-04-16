import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { textLinkClass } from "@/components/ui/linkStyles";
import { IconTint } from "@/components/ui/IconTint";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CopilotItem, CopilotOverview, CopilotSeverity } from "@/features/copilot/types";

function severityTone(sev: CopilotSeverity) {
  if (sev === "danger") return "danger" as const;
  if (sev === "warning") return "warning" as const;
  return "info" as const;
}

function CopilotRow({ item }: { item: CopilotItem }) {
  return (
    <div className="rounded-xl bg-white/72 px-3.5 py-3 ring-1 ring-slate-200/65 transition-shadow duration-200 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.detail}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge tone={severityTone(item.severity)}>{item.severity}</StatusBadge>
          {item.metric ? <span className="text-xs font-semibold tabular-nums text-slate-700">{item.metric}</span> : null}
        </div>
      </div>
      {item.action_path && item.action_label ? (
        <div className="mt-2">
          <Link to={item.action_path} className={`text-xs font-semibold ${textLinkClass}`}>
            {item.action_label} →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-2/3 animate-pulse rounded-md bg-slate-100" />
      <div className="h-3 w-full animate-pulse rounded-md bg-slate-100" />
      <div className="h-3 w-5/6 animate-pulse rounded-md bg-slate-100" />
    </div>
  );
}

export function DashboardCopilotPanel({ data, loading }: { data: CopilotOverview | null; loading: boolean }) {
  return (
    <Card className="h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,249,252,0.88))]">
      <div className="border-b border-slate-100/90 px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <IconTint tone="brand" size="md">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M12 3v3" strokeLinecap="round" />
                  <path d="M8 6h8a4 4 0 014 4v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a4 4 0 014-4z" />
                  <path d="M9 21h6" strokeLinecap="round" />
                </svg>
              </IconTint>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-700">Copilot</p>
                <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">Operational insights</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Proactive signals from inventory, orders, suppliers, and returns—no chat required.
            </p>
          </div>
          {!loading && data?.sales_trend ? (
            <div className="hidden shrink-0 rounded-2xl bg-brand-50/45 px-3 py-2 text-right ring-1 ring-brand-100/70 sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Sales ({data.sales_trend.window_days}d)
              </p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-brand-700">
                <span className="rounded-md bg-white/75 px-1.5 py-0.5">{data.sales_trend.current_units}</span>{" "}
                <span className="text-xs font-medium text-slate-500">vs {data.sales_trend.previous_units}</span>
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          {loading ? (
            <SkeletonBlock />
          ) : (
            <p className="text-sm leading-relaxed text-slate-800">{data?.summary ?? "—"}</p>
          )}
        </div>
      </div>

      <div className="grid gap-8 px-8 py-8 lg:grid-cols-3">
        <section aria-label="Alerts">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Alerts</h3>
            <StatusBadge tone="danger">Attention</StatusBadge>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              <SkeletonBlock />
            ) : (data?.alerts?.length ?? 0) > 0 ? (
              data!.alerts.map((a) => <CopilotRow key={a.id} item={a} />)
            ) : (
              <p className="text-xs text-slate-500">No alerts right now.</p>
            )}
          </div>
        </section>

        <section aria-label="Insights">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Insights</h3>
            <StatusBadge tone="info">Signals</StatusBadge>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              <SkeletonBlock />
            ) : (data?.insights?.length ?? 0) > 0 ? (
              data!.insights.map((i) => <CopilotRow key={i.id} item={i} />)
            ) : (
              <p className="text-xs text-slate-500">No insights yet.</p>
            )}
          </div>
        </section>

        <section aria-label="Suggestions">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Suggestions</h3>
            <StatusBadge tone="success">Next steps</StatusBadge>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              <SkeletonBlock />
            ) : (data?.suggestions?.length ?? 0) > 0 ? (
              data!.suggestions.map((s) => <CopilotRow key={s.id} item={s} />)
            ) : (
              <p className="text-xs text-slate-500">No suggestions at the moment.</p>
            )}
          </div>
        </section>
      </div>

      {!loading && data ? (
        <div className="border-t border-slate-100/90 px-8 py-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Best sellers (30d)</p>
              <ul className="mt-2 space-y-2 text-xs text-slate-700">
                {data.best_sellers.slice(0, 3).map((r) => (
                  <li key={r.product_model_id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">{r.label}</span>
                    <span className="shrink-0 tabular-nums font-semibold text-slate-900">{r.units}</span>
                  </li>
                ))}
                {data.best_sellers.length === 0 ? <li className="text-slate-500">Not enough recent sales.</li> : null}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slow movers</p>
              <ul className="mt-2 space-y-2 text-xs text-slate-700">
                {data.slow_movers.slice(0, 3).map((r) => (
                  <li key={r.product_model_id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">{r.label}</span>
                    <span className="shrink-0 tabular-nums font-semibold text-slate-900">{r.units}</span>
                  </li>
                ))}
                {data.slow_movers.length === 0 ? <li className="text-slate-500">No obvious slow movers.</li> : null}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier activity (30d)</p>
              <ul className="mt-2 space-y-2 text-xs text-slate-700">
                {data.supplier_activity.slice(0, 3).map((s) => (
                  <li key={s.supplier_id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">{s.name}</span>
                    <span className="shrink-0 tabular-nums font-semibold text-slate-900">{s.purchase_orders_30d} POs</span>
                  </li>
                ))}
                {data.supplier_activity.length === 0 ? <li className="text-slate-500">No recent PO activity.</li> : null}
              </ul>
            </div>
          </div>
          <p className="mt-6 text-[11px] text-slate-400">
            Generated {new Date(data.generated_at).toLocaleString()} · Rule-based analysis (deterministic, auditable).
          </p>
        </div>
      ) : null}
    </Card>
  );
}
