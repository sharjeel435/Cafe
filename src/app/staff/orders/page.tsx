import { campusClock } from "@/lib/order-helpers";
import { getStaffOrders } from "@/server/actions/orders";
import { StaffDashboardClient } from "@/features/staff/staff-dashboard-client";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Orders — Staff" };

export default async function StaffOrdersPage() {
  const orders = await getStaffOrders();

  const clock = campusClock();
  const todayStats = await prisma.order.groupBy({ by: ["status"], _count: true, where: { createdAt: { gte: clock.start, lt: clock.end } } });
  const statsMap = Object.fromEntries(todayStats.map(s => [s.status, s._count]));

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
