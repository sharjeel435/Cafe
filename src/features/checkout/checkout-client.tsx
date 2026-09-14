"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Wallet, Banknote, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, paisaToRupees } from "@/lib/utils";
import { createOrder } from "@/server/actions/orders";
import { toast } from "@/components/ui/toast";
import type { Cart, CartItem, MenuItem } from "@/types/models";

type FullCart = Cart & {
  items: (CartItem & { unitPricePaisa: number; menuItem: MenuItem })[];
};

interface SlotData {
  id: string;
  startTime: string;
  endTime: string;
  maxOrders: number;
  currentCount: number;
  isFull: boolean;
  spotsLeft: number;
}

interface CheckoutClientProps {
  cart: FullCart;
  slots: SlotData[];
  walletBalance: number;
  settings: Record<string, string>;
}

export function CheckoutClient({
  cart,
  slots,
  walletBalance,
  settings,
}: CheckoutClientProps) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "WALLET">(settings.cashEnabled !== "false" ? "CASH" : "WALLET");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ orderNumber: string } | null>(null);

  const subtotal = cart.items.reduce(
    (acc, item) =>
      acc + (item.unitPricePaisa / 100) * item.quantity,
    0
  );
  const serviceFee = parseFloat(settings.serviceFee ?? "0");
  const total = subtotal + serviceFee;

  const walletBalanceRupees = walletBalance / 100;
  const walletSufficient = walletBalanceRupees >= total;

  const handleSubmit = async () => {
    if (!selectedSlot) {
      toast.error("Please select a pickup time slot");
      return;
    }

    if (paymentMethod === "WALLET" && !walletSufficient) {
      toast.error("Insufficient wallet balance");
      return;
    }

    setLoading(true);

    const result = await createOrder({
      pickupSlotId: selectedSlot,
      paymentMethod,
      specialNote: note || undefined,
    });

    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setSuccess({ orderNumber: result.data.orderNumber });
    setTimeout(() => {
      router.push(`/student/orders/${result.data.orderId}`);
    }, 2000);
  };

  if (success) {
    return (
      <div className="py-16 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-1">Your order number is</p>
        <p className="text-2xl font-bold text-orange-600 mb-4">
          {success.orderNumber}
        </p>
        <p className="text-sm text-gray-500">Redirecting to order tracking…</p>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-5">
      <h1 className="text-lg font-bold text-gray-900">Checkout</h1>

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">
          Order Summary
        </h2>
        <div className="space-y-2">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.menuItem.name}{" "}
                <span className="text-gray-400">×{item.quantity}</span>
              </span>
              <span className="font-medium text-gray-900">
                {formatPrice(
                  ((item.unitPricePaisa / 100) * item.quantity).toFixed(2)
                )}
              </span>
            </div>
          ))}
          {serviceFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service fee</span>
              <span className="font-medium">{formatPrice(serviceFee.toFixed(2))}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-orange-600">{formatPrice(total.toFixed(2))}</span>
          </div>
        </div>
      </div>

      {/* Pickup slot selection */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-1.5">
          <Clock size={15} />
          Choose Pickup Time
        </h2>

        {slots.length === 0 ? (
          <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-700 text-sm">
            <AlertCircle size={16} />
            No pickup slots available right now. Try again later.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => !slot.isFull && setSelectedSlot(slot.id)}
                disabled={slot.isFull}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  slot.isFull
                    ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                    : selectedSlot === slot.id
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
              >
                <div className="font-semibold text-sm text-gray-900">
                  {slot.startTime} – {slot.endTime}
                </div>
                <div className="text-xs mt-0.5">
                  {slot.isFull ? (
                    <Badge variant="danger">Full</Badge>
                  ) : (
                    <span className="text-gray-400">
                      {slot.spotsLeft} spot{slot.spotsLeft !== 1 ? "s" : ""} left
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Payment method */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">
          Payment Method
        </h2>
        <div className="space-y-2">
          {settings.cashEnabled !== "false" && (
            <button
              onClick={() => setPaymentMethod("CASH")}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                paymentMethod === "CASH"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                <Banknote size={18} className="text-green-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-800">
                  Cash at Pickup
                </div>
                <div className="text-xs text-gray-500">
                  Pay when you collect your order
                </div>
              </div>
              {paymentMethod === "CASH" && (
                <CheckCircle size={18} className="text-orange-500 ml-auto" />
              )}
            </button>
          )}

          {settings.walletEnabled !== "false" && (
            <button
              onClick={() => setPaymentMethod("WALLET")}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                paymentMethod === "WALLET"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                <Wallet size={18} className="text-blue-600" />
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-semibold text-gray-800">
                  Campus Wallet
                </div>
                <div className="text-xs text-gray-500">
                  Balance:{" "}
                  <span
                    className={
                      walletSufficient ? "text-green-600" : "text-red-500"
                    }
                  >
                    {paisaToRupees(walletBalance)}
                  </span>
                </div>
              </div>
              {paymentMethod === "WALLET" && (
                <CheckCircle size={18} className="text-orange-500" />
              )}
            </button>
          )}
        </div>

        {paymentMethod === "WALLET" && !walletSufficient && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle size={12} />
            Insufficient balance. Need{" "}
            {formatPrice((total - walletBalanceRupees).toFixed(2))} more.
          </p>
        )}
      </div>

      {/* Special note */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Special Note
          <span className="font-normal text-gray-400 ml-1">(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any special instructions for the order…"
          maxLength={300}
          rows={2}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
      </div>

      <Button
        fullWidth
        size="lg"
        loading={loading}
        disabled={!selectedSlot || (paymentMethod === "WALLET" && !walletSufficient)}
        onClick={handleSubmit}
      >
        Place Order · {formatPrice(total.toFixed(2))}
      </Button>
    </div>
  );
}
