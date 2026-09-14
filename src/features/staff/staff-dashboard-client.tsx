"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/server/actions/orders";
import { toast } from "@/components/ui/toast";
import type { Order, OrderItem, PickupSlot } from "@prisma/client";

type StaffOrder = Order & {
  items: OrderItem[];
  pickupSlot: PickupSlot | null;
  user: { name: string; studentProfile: { studentId: string } | null };
};

interface StaffDashboardClientProps {
  orders: StaffOrder[];
  stats: { waiting: number; preparing: number; ready: number; completed: number };
}

const STATUS_COLUMNS = [
  { status: "PENDING" as const, label: "New Orders", color: "border-amber-400 bg-amber-50", badge: "bg-amber-500" },
  { status: "CONFIRMED" as const, label: "Confirmed", color: "border-blue-400 bg-blue-50", badge: "bg-blue-500" },
  { status: "PREPARING" as const, label: "Preparing", color: "border-orange-400 bg-orange-50", badge: "bg-orange-500" },
  { status: "READY" as const, label: "Ready", color: "border-green-400 bg-green-50", badge: "bg-green-500" },
];

const NEXT_STATUS: Partial<Record<string, string>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

const ACTION_LABELS: Partial<Record<string, string>> = {
  PENDING: "Accept Order",
  CONFIRMED: "Start Preparing",
  PREPARING: "Mark Ready",
  READY: "Complete",
};

function OrderCard({ order, onAction }: { order: StaffOrder; onAction: (id: string, status: string) => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const nextStatus = NEXT_STATUS[order.status];
  const actionLabel = ACTION_LABELS[order.status];
  const now = Date.now();
  const ageMin = Math.floor((now - new Date(order.createdAt).getTime()) / 60000);
  const isUrgent = order.pickupSlot && ageMin > 8;

  const handleAction = async () => {
    if (!nextStatus) return;
    setLoading(true);
    await onAction(order.id, nextStatus);
    setLoading(false);
  };

  return (
    <div className={`bg-white rounded-xl border-l-4 p-3 shadow-sm ${isUrgent ? "border-l-red-500 ring-1 ring-red-200" : "border-l-gray-200"}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-bold text-sm text-gray-900">{order.orderNumber}</span>
          {isUrgent && (
            <span className="ml-2 text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
              ⚡ Urgent
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          {ageMin}m ago
        </div>
      </div>

      <div className="text-xs font-medium text-gray-700 mb-1">
        {order.user.name.split(" ")[0]}
        {order.user.studentProfile?.studentId && (
          <span className="text-gray-400 ml-1">· {order.user.studentProfile.studentId}</span>
        )}
      </div>

      <div className="space-y-0.5 mb-2">
        {order.items.map((item) => (
          <div key={item.id} className="text-xs text-gray-600">
            <span className="font-medium">×{item.quantity}</span> {item.itemName}
            {item.specialNote && (
              <span className="text-amber-600 italic"> — {item.specialNote}</span>
            )}
          </div>
        ))}
      </div>

      {order.pickupSlot && (
        <div className="text-xs text-gray-500 mb-2">
          📍 Pickup: {order.pickupSlot.startTime}–{order.pickupSlot.endTime}
        </div>
      )}

      {actionLabel && (
        <Button
          size="sm"
          fullWidth
          loading={loading}
          onClick={handleAction}
          variant={order.status === "READY" ? "secondary" : "primary"}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function StaffDashboardClient({ orders: initialOrders, stats }: StaffDashboardClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const handleAction = async (orderId: string, nextStatus: string) => {
    const result = await updateOrderStatus(orderId, nextStatus as Parameters<typeof updateOrderStatus>[1]);
    if (result.success) {
      toast.success("Order updated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Waiting", value: stats.waiting, color: "text-amber-600" },
          { label: "Preparing", value: stats.preparing, color: "text-orange-600" },
          { label: "Ready", value: stats.ready, color: "text-green-600" },
          { label: "Completed Today", value: stats.completed, color: "text-gray-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Refresh + title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Live Order Board</h2>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
        {STATUS_COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className={`rounded-2xl border-2 ${col.color} p-3 min-h-[200px]`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`${col.badge} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center`}>
                  {colOrders.length}
                </span>
                <span className="text-sm font-semibold text-gray-800">{col.label}</span>
              </div>
              <div className="space-y-2">
                {colOrders.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 py-6">
                    No orders
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onAction={handleAction} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
