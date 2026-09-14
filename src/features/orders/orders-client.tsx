"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, ChevronRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Order, OrderItem, Payment, PickupSlot } from "@/types/models";

type FullOrder = Order & {
  items: OrderItem[];
  payment: Payment | null;
  pickupSlot: PickupSlot | null;
};

const TABS = [
  { key: "active", label: "Active" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
] as const;

const EMPTY_CONFIG = {
  active: { icon: "🍳", title: "Nothing cooking yet", desc: "Order your next meal and skip the queue." },
  past: { icon: "📋", title: "No past orders", desc: "Your completed orders will appear here." },
  cancelled: { icon: "❌", title: "No cancelled orders", desc: "You have no cancelled orders." },
};

export function OrdersClient({
  orders,
  activeTab,
}: {
  orders: FullOrder[];
  activeTab: "active" | "past" | "cancelled";
}) {
  const router = useRouter();
  useEffect(() => { const timer = setInterval(() => router.refresh(), 15000); return () => clearInterval(timer); }, [router]);
  const empty = EMPTY_CONFIG[activeTab];

  return (
    <div className="py-4">
      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => router.push(`/student/orders?tab=${tab.key}`)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={empty.icon}
          title={empty.title}
          description={empty.desc}
          action={
            activeTab === "active" ? (
              <Link href="/student/menu">
                <Button>Order Now</Button>
              </Link>
            ) : undefined
          }
          className="py-16"
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/student/orders/${order.id}`}>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900">
                    {order.orderNumber}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>

                <p className="text-sm text-gray-600 line-clamp-1 mb-1">
                  {order.items.map((i) => i.itemName).join(", ")}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {formatDate(order.createdAt)}
                    {order.pickupSlot && (
                      <span>
                        · Pickup {order.pickupSlot.startTime}–
                        {order.pickupSlot.endTime}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-orange-600 text-sm">
                      {formatPrice(order.payment?.total.toString() ?? "0")}
                    </span>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
