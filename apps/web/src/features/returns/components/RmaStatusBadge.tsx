import { StatusBadge } from "@/components/ui/StatusBadge";
import { RMA_STATUS_LABELS, rmaStatusBadgeClass } from "@/features/returns/constants/statusLabels";
import type { ReturnRequestStatus } from "@/features/returns/types";

type RmaStatusBadgeProps = {
  status: ReturnRequestStatus;
};

export function RmaStatusBadge({ status }: RmaStatusBadgeProps) {
  return <StatusBadge className={rmaStatusBadgeClass(status)}>{RMA_STATUS_LABELS[status]}</StatusBadge>;
}
