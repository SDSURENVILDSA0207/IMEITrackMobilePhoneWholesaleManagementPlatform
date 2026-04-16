import type { PropsWithChildren, ReactNode } from "react";
import { Filter } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { IconTint } from "@/components/ui/IconTint";

type FilterPanelProps = PropsWithChildren<{
  title?: string;
  actions?: ReactNode;
}>;

export function FilterPanel({ title = "Filters", actions, children }: FilterPanelProps) {
  return (
    <Card className="p-4 md:p-5">
      <div className="mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <IconTint tone="neutral" size="sm">
            <Filter aria-hidden strokeWidth={2} />
          </IconTint>
          <p className="text-sm font-semibold tracking-tight text-slate-900">{title}</p>
        </div>
        {actions}
      </div>
      {children}
    </Card>
  );
}
