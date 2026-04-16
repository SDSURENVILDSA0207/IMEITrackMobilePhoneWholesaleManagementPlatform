import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { listSuppliers } from "@/features/suppliers/api";
import type { Supplier } from "@/features/suppliers/types";
import { SUPPLIER_TYPE_LABELS } from "@/features/suppliers/types";
import { canManageSuppliers } from "@/features/suppliers/utils/permissions";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { linkPrimaryButtonClassName } from "@/components/ui/Button";
import { textLinkChipClass } from "@/components/ui/linkStyles";
import { FilterPanel } from "@/components/ui/FilterPanel";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

export default function SuppliersListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canManage = canManageSuppliers(user);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [activeOnly, setActiveOnly] = useState(false);
  const [rows, setRows] = useState<Supplier[]>([]);
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
        const data = await listSuppliers({
          search: debouncedSearch || undefined,
          activeOnly,
        });
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError(extractApiErrorMessage(e, "Failed to load suppliers"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, activeOnly]);

  const columns: DataTableColumn<Supplier>[] = [
    {
      id: "name",
      header: "Name",
      className: "min-w-[10rem]",
      cell: (s) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900">{s.name}</span>
          {s.contact_person ? <span className="text-xs font-normal text-slate-500">{s.contact_person}</span> : null}
        </div>
      ),
    },
    {
      id: "email",
      header: "Email",
      cell: (s) => <span className="font-normal text-slate-600">{s.email ?? "—"}</span>,
    },
    {
      id: "phone",
      header: "Phone",
      cell: (s) => <span className="font-normal text-slate-600">{s.phone ?? "—"}</span>,
    },
    {
      id: "type",
      header: "Type",
      cell: (s) => (
        <StatusBadge tone="neutral">{SUPPLIER_TYPE_LABELS[s.supplier_type]}</StatusBadge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (s) => <StatusBadge tone={s.is_active ? "success" : "neutral"}>{s.is_active ? "Active" : "Inactive"}</StatusBadge>,
    },
    {
      id: "actions",
      header: "",
      className: "w-28 text-right",
      cell: (s) =>
        canManage ? (
          <Link to={`/suppliers/${s.id}/edit`} onClick={(e) => e.stopPropagation()} className={textLinkChipClass}>
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
        title="Suppliers"
        description="Manage supplier master data, contacts, and payment terms."
        action={
          canManage ? (
            <Link to="/suppliers/new" className={linkPrimaryButtonClassName}>
              New supplier
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

      <FilterPanel title="Filter suppliers">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <label htmlFor="supplier-search" className="sr-only">
            Search suppliers
          </label>
          <input
            id="supplier-search"
            type="search"
            placeholder="Search by name or email…"
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
        getRowKey={(s) => s.id}
        onRowClick={canManage ? (s) => navigate(`/suppliers/${s.id}/edit`) : undefined}
        loading={loading}
        emptyTitle="No suppliers found"
        emptyDescription="Adjust search or filters, or add a new supplier to get started."
        aria-label="Suppliers"
      />
    </PageContainer>
  );
}
