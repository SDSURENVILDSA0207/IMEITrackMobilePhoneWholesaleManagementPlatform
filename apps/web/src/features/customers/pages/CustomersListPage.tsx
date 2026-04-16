import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { listCustomers } from "@/features/customers/api";
import type { Customer } from "@/features/customers/types";
import { canManageCustomers } from "@/features/customers/utils/permissions";
import { formatMoney } from "@/features/customers/utils/formatMoney";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { FilterPanel } from "@/components/ui/FilterPanel";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

export default function CustomersListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canManage = canManageCustomers(user);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [activeOnly, setActiveOnly] = useState(false);
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { notice?: string } | null;
    if (state?.notice) {
      setFlash(state.notice);
      navigate(".", { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listCustomers({
          search: debouncedSearch || undefined,
          activeOnly,
        });
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError(extractApiErrorMessage(e, "Failed to load customers"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, activeOnly]);

  const columns: DataTableColumn<Customer>[] = [
    {
      id: "business",
      header: "Customer",
      className: "min-w-[10rem]",
      cell: (c) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900">{c.business_name}</span>
          {c.contact_person ? <span className="text-xs font-normal text-slate-500">{c.contact_person}</span> : null}
        </div>
      ),
    },
    {
      id: "email",
      header: "Email",
      cell: (c) => <span className="font-normal text-slate-600">{c.email ?? "—"}</span>,
    },
    {
      id: "phone",
      header: "Phone",
      cell: (c) => <span className="font-normal text-slate-600">{c.phone ?? "—"}</span>,
    },
    {
      id: "credit",
      header: "Credit limit",
      className: "whitespace-nowrap text-right tabular-nums",
      cell: (c) => <span className="font-medium text-slate-800">{formatMoney(c.credit_limit)}</span>,
    },
    {
      id: "balance",
      header: "Outstanding",
      className: "whitespace-nowrap text-right tabular-nums",
      cell: (c) => (
        <span
          className={
            Number(c.outstanding_balance ?? 0) > 0 ? "font-semibold text-amber-800" : "font-medium text-slate-700"
          }
        >
          {formatMoney(c.outstanding_balance)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (c) => <StatusBadge tone={c.is_active ? "success" : "neutral"}>{c.is_active ? "Active" : "Inactive"}</StatusBadge>,
    },
    {
      id: "actions",
      header: "",
      className: "w-28 text-right",
      cell: (c) =>
        canManage ? (
          <Link
            to={`/customers/${c.id}/edit`}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Edit
          </Link>
        ) : (
          <span className="text-xs text-slate-400">View only</span>
        ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        description="B2B accounts, credit limits, and shipping aligned with your sales order workflow."
        action={
          canManage ? (
            <Link
              to="/customers/new"
              className="inline-flex items-center justify-center rounded-lg border border-brand-600 bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 hover:border-brand-500"
            >
              New customer
            </Link>
          ) : null
        }
      />

      {flash ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
          role="status"
        >
          {flash}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <FilterPanel title="Filter customers">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <label htmlFor="customer-search" className="sr-only">
            Search customers
          </label>
          <input
            id="customer-search"
            type="search"
            placeholder="Search by business name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600/40"
          />
          Active only
        </label>
      </div>
      </FilterPanel>

      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(c) => c.id}
        loading={loading}
        emptyTitle="No customers found"
        emptyDescription="Try a different search term or turn off “Active only” to see inactive accounts."
        aria-label="Customers"
      />
    </PageContainer>
  );
}
