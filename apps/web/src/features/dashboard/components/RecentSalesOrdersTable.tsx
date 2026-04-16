import { Link } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { SoStatusBadge } from "@/features/sales-orders/components/SoStatusBadge";
import type { RecentSalesOrderRow } from "@/features/dashboard/types";
import { formatMoney } from "@/features/customers/utils/formatMoney";

import { formatDashboardDate } from "../utils/formatDashboardDate";

type RecentSalesOrdersTableProps = {
  rows: RecentSalesOrderRow[];
  loading?: boolean;
};

export function RecentSalesOrdersTable({ rows, loading }: RecentSalesOrdersTableProps) {
  const columns: DataTableColumn<RecentSalesOrderRow>[] = [
    {
      id: "order",
      header: "Order",
      cell: (row) => (
        <Link to={`/sales-orders/${row.id}`} className="font-semibold text-brand-700 hover:text-brand-600">
          {row.order_number}
        </Link>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      className: "max-w-[11rem]",
      cell: (row) => (
        <span className="block truncate text-slate-700" title={row.customer_name ?? undefined}>
          {row.customer_name ?? "—"}
        </span>
      ),
    },
    { id: "status", header: "Status", cell: (row) => <SoStatusBadge status={row.status} /> },
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
      emptyTitle="No sales orders yet."
      emptyDescription="Sales orders created by your team will appear here."
      aria-label="Recent sales orders"
    />
  );
}
