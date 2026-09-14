import { Badge } from "./badge";
import type { OrderStatus } from "@prisma/client";

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    variant: "default" | "success" | "warning" | "danger" | "info" | "orange";
  }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "info" },
  PREPARING: { label: "Preparing", variant: "orange" },
  READY: { label: "Ready! 🎉", variant: "success" },
  COMPLETED: { label: "Completed", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function RushLevelBadge({ level }: { level: string }) {
  const config: Record<string, { label: string; color: string }> = {
    LOW: { label: "● Low Traffic", color: "text-green-600" },
    MODERATE: { label: "● Moderate", color: "text-amber-600" },
    BUSY: { label: "● Busy", color: "text-orange-600" },
    VERY_BUSY: { label: "● Very Busy", color: "text-red-600" },
  };
  const c = config[level] ?? config.LOW;
  return (
    <span className={`text-xs font-semibold ${c.color}`}>{c.label}</span>
  );
}
