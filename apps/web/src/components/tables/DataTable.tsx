import type { ReactNode } from "react";

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
    <div className="overflow-x-auto rounded-2xl bg-white/[0.93] ring-1 ring-slate-200/45">
      <table className="min-w-full border-collapse text-left text-sm" aria-label={ariaLabel}>
        <thead className="sticky top-0 z-[1] border-b border-slate-100/90 bg-slate-50/80 backdrop-blur-sm">
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className={`align-middle px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500/95 ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/55">
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`sk-${i}`} className="animate-pulse bg-white">
                {columns.map((col) => (
                  <td key={col.id} className={`align-middle px-6 py-5 ${col.className ?? ""}`}>
                    <div className="h-4 w-full max-w-[12rem] rounded bg-slate-100/90" />
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
                className={`bg-white transition-colors duration-150 hover:bg-slate-50/90 ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={`align-middle px-6 py-5 text-sm font-normal text-slate-700/95 [&_a]:font-medium ${col.className ?? ""}`}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
