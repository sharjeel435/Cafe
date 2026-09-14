import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCafeteriaStatus } from "@/server/actions/settings";
import { getStudentOrders } from "@/server/actions/orders";
import { getWallet } from "@/server/actions/wallet";
import { getMenuItems } from "@/server/actions/menu";
import { RushLevelBadge, OrderStatusBadge } from "@/components/ui/status-badge";
import { Clock, Wallet, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, paisaToRupees, timeAgo } from "@/lib/utils";

const QUICK_CATEGORIES = [
  { emoji: "🍛", name: "Desi", slug: "desi" },
  { emoji: "🍔", name: "Burgers", slug: "burgers" },
  { emoji: "🥪", name: "Sandwiches", slug: "sandwiches" },
  { emoji: "🍟", name: "Snacks", slug: "snacks" },
  { emoji: "🥤", name: "Drinks", slug: "drinks" },
  { emoji: "☕", name: "Chai", slug: "tea-coffee" },
];

export default async function StudentDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  const [status, orders, wallet, allItems] = await Promise.all([
    getCafeteriaStatus(),
    getStudentOrders("active"),
    getWallet(),
    getMenuItems({ availableOnly: true }),
  ]);

  const popularItems = allItems.slice(0, 4);

  const firstName = session.user.name.split(" ")[0];
  const activeOrder = orders[0] ?? null;

  return (
    <div className="space-y-6 py-4">
      {/* ── GREETING ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">Assalam-o-Alaikum,</p>
          <h1 className="text-xl font-bold text-gray-900">
            {firstName} 👋
          </h1>
        </div>
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            status.isOpen
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status.isOpen ? "● Cafeteria Open" : "● Cafeteria Closed"}
        </div>
      </div>

      {/* ── STATUS ROW ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
          <div className="text-lg font-bold text-orange-600">
            {status.avgPrepTime}m
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Avg. Prep</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
          <RushLevelBadge level={status.rushLevel} />
          <div className="text-xs text-gray-500 mt-1">Traffic</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
          <div className="text-sm font-bold text-gray-800">
            {status.nextSlot ?? "—"}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Next Slot</div>
        </div>
      </div>

      {/* ── ACTIVE ORDER ──────────────────────────────────────────── */}
      {activeOrder ? (
        <Link href={`/student/orders/${activeOrder.id}`}>
          <div className="bg-orange-500 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-medium text-orange-100">
                  Active Order
                </div>
                <div className="font-bold text-lg">{activeOrder.orderNumber}</div>
              </div>
              <OrderStatusBadge status={activeOrder.status} />
            </div>
            <div className="text-sm text-orange-100">
              {activeOrder.items.map((i) => i.itemName).join(", ")}
            </div>
            {activeOrder.pickupSlot && (
              <div className="flex items-center gap-1 text-xs text-orange-200 mt-2">
                <Clock size={12} />
                Pickup at {activeOrder.pickupSlot.startTime}–
                {activeOrder.pickupSlot.endTime}
              </div>
            )}
            <div className="flex items-center justify-end mt-3 text-xs font-medium text-orange-100">
              View details <ChevronRight size={14} />
            </div>
          </div>
        </Link>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <div className="text-2xl mb-2">🍳</div>
          <p className="text-sm font-medium text-gray-700 mb-0.5">
            Nothing cooking yet
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Order your next meal and skip the queue.
          </p>
          <Link href="/student/menu">
            <Button size="sm">Order Now</Button>
          </Link>
        </div>
      )}

      {/* ── WALLET BALANCE ────────────────────────────────────────── */}
      <Link href="/student/wallet">
        <div className="bg-gray-900 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Campus Wallet</div>
              <div className="font-bold text-white text-lg">
                {wallet ? paisaToRupees(wallet.balance) : "Rs. 0"}
              </div>
            </div>
          </div>
          <div className="text-gray-400">
            <ArrowRight size={18} />
          </div>
        </div>
      </Link>

      {/* ── QUICK CATEGORIES ──────────────────────────────────────── */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Browse Menu</h2>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/student/menu?category=${cat.slug}`}
              className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col items-center gap-1.5 hover:border-orange-200 hover:bg-orange-50/50 transition-colors"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-gray-700">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── POPULAR ITEMS ─────────────────────────────────────────── */}
      {popularItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Popular Today</h2>
            <Link
              href="/student/menu"
              className="text-xs text-orange-600 font-medium"
            >
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {popularItems.map((item) => (
              <Link
                key={item.id}
                href={`/student/menu/${item.id}`}
                className="bg-white rounded-2xl border border-gray-100 p-3 hover:shadow-md transition-shadow"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-28 object-cover rounded-xl mb-2"
                  />
                ) : (
                  <div className="w-full h-28 bg-orange-50 rounded-xl mb-2 flex items-center justify-center text-4xl">
                    🍽️
                  </div>
                )}
                <div className="text-sm font-semibold text-gray-800 line-clamp-1">
                  {item.name}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm font-bold text-orange-600">
                    {formatPrice(item.price.toString())}
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      item.isAvailable ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {item.isAvailable ? "Available" : "Sold out"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
