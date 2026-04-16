import { StatusBadge } from "@/components/ui/StatusBadge";
import { PO_STATUS_LABELS, poStatusBadgeClass } from "@/features/purchase-orders/constants/statusLabels";
import type { PurchaseOrderStatus } from "@/features/purchase-orders/types";

type PoStatusBadgeProps = {
  status: PurchaseOrderStatus;
  className?: string;
};

export function PoStatusBadge({ status, className = "" }: PoStatusBadgeProps) {
  return <StatusBadge className={`${poStatusBadgeClass(status)} ${className}`}>{PO_STATUS_LABELS[status]}</StatusBadge>;
}
