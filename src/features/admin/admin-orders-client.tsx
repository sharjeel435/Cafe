"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Order, OrderItem, Payment, PickupSlot } from "@prisma/client";

type AdminOrder = Order & {
  user: { name: string; email: string };
  items: OrderItem[];
  payment: Payment | null;
  pickupSlot: PickupSlot | null;
};

export function AdminOrdersClient({ orders }: { orders: AdminOrder[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.orderNumber.includes(search.toUpperCase()) ||
      o.user.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !status || o.status === status;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">All Orders ({filtered.length})</h1>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order # or student name…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">All Statuses</option>
          {["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"].map(
            (s) => <option key={s} value={s}>{s}</option>
          )}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Order #</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Items</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono font-semibold text-gray-900 text-xs">
                  {order.orderNumber}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{order.user.name}</div>
                  <div className="text-xs text-gray-400">{order.user.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                  {order.items.map((i) => `${i.itemName} ×${i.quantity}`).join(", ")}
                </td>
                <td className="px-4 py-3 font-semibold text-orange-600">
                  {order.payment ? formatPrice(order.payment.total.toString()) : "—"}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {formatDate(order.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
