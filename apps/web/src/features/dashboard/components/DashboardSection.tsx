import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { textLinkPillClass } from "@/components/ui/linkStyles";

type DashboardSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  /** Optional “View all” link */
  viewAllTo?: string;
  viewAllLabel?: string;
  className?: string;
};

export function DashboardSection({
  title,
  description,
  children,
  viewAllTo,
  viewAllLabel = "View all",
  className = "",
}: DashboardSectionProps) {
  return (
    <Card className={`p-8 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p> : null}
        </div>
        {viewAllTo ? (
          <Link to={viewAllTo} className={textLinkPillClass}>
            {viewAllLabel} →
          </Link>
        ) : null}
      </div>
      <div className="mt-8">{children}</div>
    </Card>
  );
}
