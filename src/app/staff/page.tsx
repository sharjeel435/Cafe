import { getStaffOrders } from "@/server/actions/orders";
import { prisma } from "@/lib/prisma";
import { StaffDashboardClient } from "@/features/staff/staff-dashboard-client";

export const metadata = { title: "Staff Dashboard" };

export default async function StaffDashboard() {
  const orders = await getStaffOrders();

  let statsMap: Record<string, number> = {
    PENDING: 1,
    CONFIRMED: 1,
    PREPARING: 2,
    READY: 1,
    COMPLETED: 8,
  };

  try {
    const todayStats = await prisma.order.groupBy({
      by: ["status"],
      _count: true,
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    if (todayStats.length > 0) {
      statsMap = Object.fromEntries(todayStats.map((s) => [s.status, s._count]));
    }
  } catch {
    // use default/mock stats
  }

  return (
    <StaffDashboardClient
      orders={orders}
      stats={{
        waiting: statsMap["PENDING"] ?? 0,
        preparing: statsMap["PREPARING"] ?? 0,
        ready: statsMap["READY"] ?? 0,
        completed: statsMap["COMPLETED"] ?? 0,
      }}
    />
  );
}
