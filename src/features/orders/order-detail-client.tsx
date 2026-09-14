"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Check, Loader2, AlertTriangle } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";
import { cancelOrder } from "@/server/actions/orders";
import { toast } from "@/components/ui/toast";
import type { Order, OrderItem, Payment, PickupSlot } from "@prisma/client";

type FullOrder = Order & {
  items: OrderItem[];
  payment: Payment | null;
  pickupSlot: PickupSlot | null;
  user: { name: string; email: string; studentProfile: { studentId: string } | null } | null;
};

const STATUS_STEPS = [
  { status: "PENDING", label: "Order received" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY", label: "Ready for pickup" },
  { status: "COMPLETED", label: "Completed" },
];

const STATUS_ORDER = ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED"];

export function OrderDetailClient({ order }: { order: FullOrder }) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";
  const canCancel =
    order.status === "PENDING" || order.status === "CONFIRMED";

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    const result = await cancelOrder(order.id);
    setCancelling(false);
    if (result.success) {
      toast.success("Order cancelled");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-xs text-gray-500">
            {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
          </p>
        </div>
        <div className="ml-auto">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Ready / Pickup code */}
      {order.status === "READY" && order.pickupCode && (
        <div className="bg-green-500 rounded-2xl p-5 text-white text-center">
          <div className="text-2xl mb-1">🎉</div>
          <div className="font-bold text-lg mb-1">Your food is ready!</div>
          <div className="text-green-100 text-sm mb-3">
            Show this code at the counter
          </div>
          <div className="text-4xl font-black tracking-widest bg-white/20 rounded-xl py-3 px-4 inline-block">
            {order.pickupCode}
          </div>
          <div className="text-xs text-green-100 mt-2">Pickup Code</div>
        </div>
      )}

      {/* Status timeline */}
      {!isCancelled ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Order Progress
          </h2>
          <div className="space-y-3">
            {STATUS_STEPS.map((step, i) => {
              const stepIndex = STATUS_ORDER.indexOf(step.status);
              const isDone = currentIndex >= stepIndex;
              const isCurrent = currentIndex === stepIndex;
              return (
                <div key={step.status} className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isDone
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isDone ? (
                      isCurrent && order.status !== "COMPLETED" ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )
                    ) : (
                      <span className="text-xs">{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      isDone
                        ? "font-semibold text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && order.status !== "COMPLETED" && (
                    <span className="ml-auto text-xs text-orange-600 font-medium">
                      In progress
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-200 text-red-700">
          <AlertTriangle size={16} />
          <span className="text-sm font-medium">This order was cancelled.</span>
        </div>
      )}

      {/* Pickup info */}
      {order.pickupSlot && (
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
            <Clock size={18} className="text-orange-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Pickup Time</div>
            <div className="font-semibold text-gray-900">
              {order.pickupSlot.startTime} – {order.pickupSlot.endTime}
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Items</h2>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.itemName}{" "}
                <span className="text-gray-400">×{item.quantity}</span>
              </span>
              <span className="font-medium">
                {formatPrice(item.subtotal.toString())}
              </span>
            </div>
          ))}
        </div>
        {order.payment && (
          <>
            <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
              {parseFloat(order.payment.serviceFee.toString()) > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Service fee</span>
                  <span>{formatPrice(order.payment.serviceFee.toString())}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-orange-600">
                  {formatPrice(order.payment.total.toString())}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Payment</span>
                <span className="capitalize">
                  {order.payment.method === "CASH"
                    ? "Cash at pickup"
                    : "Campus Wallet"}
                  {" · "}
                  {order.payment.status}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {canCancel && (
        <Button
          variant="danger"
          fullWidth
          loading={cancelling}
          onClick={handleCancel}
        >
          Cancel Order
        </Button>
      )}
    </div>
  );
}
