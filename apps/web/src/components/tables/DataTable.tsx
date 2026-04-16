import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  /** @deprecated Prefer emptyTitle + emptyDescription */
  emptyMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  loading?: boolean;
  /** Skeleton rows when loading (default 6). */
  skeletonRows?: number;
  "aria-label"?: string;
  onRowClick?: (row: T) => void;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = "No rows to display.",
  emptyTitle,
  emptyDescription,
  loading = false,
  skeletonRows = 6,
  "aria-label": ariaLabel = "Data table",
  onRowClick,
}: DataTableProps<T>) {
  const resolvedEmptyTitle = emptyTitle ?? emptyMessage;
  const resolvedEmptyDescription = emptyDescription;

  return (
    <Card className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm" aria-label={ariaLabel}>
        <thead className="sticky top-0 z-[1] bg-slate-50/95 backdrop-blur">
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`sk-${i}`} className="animate-pulse bg-white odd:bg-white even:bg-slate-50/40">
                {columns.map((col) => (
                  <td key={col.id} className={`px-4 py-4 ${col.className ?? ""}`}>
                    <div className="h-4 w-full max-w-[12rem] rounded bg-slate-200/80" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-0">
                <EmptyState title={resolvedEmptyTitle} description={resolvedEmptyDescription} />
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={`odd:bg-white even:bg-slate-50/40 transition-colors duration-150 hover:bg-brand-50/50 ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {columns.map((col) => (
                  <td key={col.id} className={`px-4 py-4 text-sm font-medium text-slate-800 ${col.className ?? ""}`}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
}
