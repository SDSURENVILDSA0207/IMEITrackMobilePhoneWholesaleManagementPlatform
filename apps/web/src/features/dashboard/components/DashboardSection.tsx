import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";

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
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          {description ? <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p> : null}
        </div>
        {viewAllTo ? (
          <Link
            to={viewAllTo}
            className="shrink-0 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-600"
          >
            {viewAllLabel} →
          </Link>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}
