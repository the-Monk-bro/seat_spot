import { cn } from "@/lib/utils";
import type { RestaurantStatus, ReservationStatus } from "@/types";

type Status = RestaurantStatus | ReservationStatus;

const statusConfig: Record<Status, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "badge-pending" },
  APPROVED: { label: "Approved", className: "badge-approved" },
  REJECTED: { label: "Rejected", className: "badge-rejected" },
  CONFIRMED: { label: "Confirmed", className: "badge-confirmed" },
  CANCELLED: { label: "Cancelled", className: "badge-cancelled" },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
