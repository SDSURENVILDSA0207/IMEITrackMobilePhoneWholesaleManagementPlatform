import type { PropsWithChildren, ReactNode } from "react";
import { Card } from "@/components/ui/Card";

type FilterPanelProps = PropsWithChildren<{
  title?: string;
  actions?: ReactNode;
}>;

export function FilterPanel({ title = "Filters", actions, children }: FilterPanelProps) {
  return (
    <Card className="p-4 md:p-5">
      <div className="mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold tracking-tight text-slate-900">{title}</p>
        {actions}
      </div>
      {children}
    </Card>
  );
}
