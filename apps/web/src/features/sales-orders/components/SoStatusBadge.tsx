import { StatusBadge } from "@/components/ui/StatusBadge";
import { SO_STATUS_LABELS, soStatusBadgeClass } from "@/features/sales-orders/constants/statusLabels";
import type { SalesOrderStatus } from "@/features/sales-orders/types";

type SoStatusBadgeProps = {
  status: SalesOrderStatus;
};

export function SoStatusBadge({ status }: SoStatusBadgeProps) {
  return <StatusBadge className={soStatusBadgeClass(status)}>{SO_STATUS_LABELS[status]}</StatusBadge>;
}
