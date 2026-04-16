import { Link } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PoStatusBadge } from "@/features/purchase-orders/components/PoStatusBadge";
import type { RecentPurchaseOrderRow } from "@/features/dashboard/types";
import { formatMoney } from "@/features/customers/utils/formatMoney";

import { formatDashboardDate } from "../utils/formatDashboardDate";

type RecentPurchaseOrdersTableProps = {
  rows: RecentPurchaseOrderRow[];
  loading?: boolean;
};

export function RecentPurchaseOrdersTable({ rows, loading }: RecentPurchaseOrdersTableProps) {
  const columns: DataTableColumn<RecentPurchaseOrderRow>[] = [
    {
      id: "po",
      header: "PO",
      cell: (row) => (
        <Link to={`/purchase-orders/${row.id}`} className="font-semibold text-brand-700 hover:text-brand-600">
          {row.po_number}
        </Link>
      ),
    },
    {
      id: "supplier",
      header: "Supplier",
      className: "max-w-[11rem]",
      cell: (row) => (
        <span className="block truncate text-slate-700" title={row.supplier_name ?? undefined}>
          {row.supplier_name ?? "—"}
        </span>
      ),
    },
    { id: "status", header: "Status", cell: (row) => <PoStatusBadge status={row.status} /> },
    { id: "total", header: "Total", className: "hidden sm:table-cell tabular-nums", cell: (row) => formatMoney(row.total_amount) },
    {
      id: "created",
      header: "Created",
      className: "text-right whitespace-nowrap",
      cell: (row) => <span className="text-slate-600">{formatDashboardDate(row.created_at)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowKey={(row) => row.id}
      loading={loading}
      skeletonRows={4}
      emptyTitle="No purchase orders yet."
      emptyDescription="Created purchase orders will appear here as soon as procurement starts."
      aria-label="Recent purchase orders"
    />
  );
}
