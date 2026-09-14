"use client";

import { formatPrice } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts";

interface AnalyticsData {
  todayOrders: number;
  todayCompleted: number;
  todayRevenue: number;
  todayCancelled: number;
  cancellationRate: string;
  totalUsers: number;
  popularItems: { menuItemId: string; itemName: string; _sum: { quantity: number | null } }[];
  ordersByHour: { hour: number; count: number }[];
  revenueByDay: { date: string; revenue: number }[];
  statusBreakdown: { status: string; _count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PREPARING: "#f97316",
  READY: "#22c55e",
  COMPLETED: "#6b7280",
  CANCELLED: "#ef4444",
};

const HOUR_LABELS = (h: number) => {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
};

export function AdminDashboardClient({ analytics }: { analytics: AnalyticsData | null }) {
  if (!analytics) return <div className="text-gray-500">Unable to load analytics.</div>;

  const {
    todayOrders, todayCompleted, todayRevenue, cancellationRate,
    totalUsers, popularItems, ordersByHour, revenueByDay, statusBreakdown,
  } = analytics;

  const statCards = [
    { label: "Today's Revenue", value: formatPrice(todayRevenue.toFixed(2)), color: "text-green-600", bg: "bg-green-50" },
    { label: "Today's Orders", value: todayOrders, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Completed", value: todayCompleted, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Cancellation Rate", value: `${cancellationRate}%`, color: "text-red-600", bg: "bg-red-50" },
    { label: "Total Students", value: totalUsers, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const hourData = ordersByHour.map((d) => ({
    hour: HOUR_LABELS(d.hour),
    orders: d.count,
  }));

  const revenueData = revenueByDay.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-PK", { month: "short", day: "numeric" }),
    revenue: d.revenue,
  }));

  const pieData = statusBreakdown.map((s) => ({
    name: s.status,
    value: s._count,
    color: STATUS_COLORS[s.status] ?? "#ccc",
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Orders by hour */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Orders by Hour (Today)</h2>
          {hourData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by day */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Revenue (Last 7 Days)</h2>
          {revenueData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`Rs. ${v}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Popular items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Most Ordered Items</h2>
          <div className="space-y-2">
            {popularItems.slice(0, 6).map((item, i) => (
              <div key={item.menuItemId} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{
                      width: `${Math.min(100, ((item._sum.quantity ?? 0) / (popularItems[0]._sum.quantity ?? 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-36 truncate">{item.itemName}</span>
                <span className="text-xs text-gray-500 w-8 text-right">{item._sum.quantity ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Order Status Breakdown</h2>
          {pieData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={70} innerRadius={40}>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-gray-600 capitalize">{d.name.toLowerCase()}</span>
                    <span className="font-semibold text-gray-800 ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
