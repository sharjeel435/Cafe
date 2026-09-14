"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyPickupCode, updateOrderStatus } from "@/server/actions/orders";
import { toast } from "@/components/ui/toast";

export default function StaffPickupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [found, setFound] = useState<{
    orderId: string;
    orderNumber: string;
    studentName: string;
    items: { name: string; qty: number }[];
  } | null>(null);

  const handleVerify = async () => {
    if (code.length !== 4) {
      toast.error("Please enter a 4-digit pickup code");
      return;
    }
    setLoading(true);
    const result = await verifyPickupCode(code);
    setLoading(false);
    if (result.success) {
      setFound(result.data);
    } else {
      toast.error(result.error);
      setFound(null);
    }
  };

  const handleComplete = async () => {
    if (!found) return;
    setCompleting(true);
    const result = await updateOrderStatus(found.orderId, "COMPLETED");
    setCompleting(false);
    if (result.success) {
      toast.success("Order marked as collected!");
      setFound(null);
      setCode("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Pickup Verification</h1>

      {/* Code input */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <div className="flex items-center gap-2 mb-4 text-gray-600">
          <QrCode size={20} />
          <span className="font-semibold">Enter Pickup Code</span>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              setCode(v);
              if (v.length === 4) setFound(null);
            }}
            placeholder="4-digit code"
            className="flex-1 h-14 text-3xl font-bold tracking-[0.4em] text-center rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
          <Button size="lg" loading={loading} onClick={handleVerify}>
            Check
          </Button>
        </div>
      </div>

      {/* Result */}
      {found && (
        <div className="bg-white rounded-2xl border-2 border-green-300 p-6">
          <div className="flex items-center gap-2 text-green-600 font-bold mb-4">
            <CheckCircle2 size={20} />
            Order Found
          </div>

          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order</span>
              <span className="font-bold text-gray-900">{found.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Student</span>
              <span className="font-semibold text-gray-900">{found.studentName}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 mb-5">
            <div className="text-xs text-gray-500 font-medium mb-2">Items</div>
            {found.items.map((item, i) => (
              <div key={i} className="text-sm text-gray-800">
                ×{item.qty} {item.name}
              </div>
            ))}
          </div>

          <Button fullWidth size="lg" onClick={handleComplete} loading={completing}>
            ✓ Mark as Collected
          </Button>
        </div>
      )}

      <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
        <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          Only orders with status <strong>Ready</strong> can be verified.
          Ask the student to show their 4-digit pickup code.
        </p>
      </div>
    </div>
  );
}
