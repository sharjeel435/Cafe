"use server";

import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { auth } from "@/lib/auth";

/** Get cafeteria system settings as key-value map */
export async function getSettings(): Promise<Record<string, string>> {
  if (Object.keys(mockStore.settings).length > 0) {
    return mockStore.settings;
  }

  try {
    const settings = await prisma.systemSetting.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  } catch {
    return mockStore.settings;
  }
}

/** Check if cafeteria is currently open */
export async function getCafeteriaStatus(): Promise<{
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  rushLevel: string;
  avgPrepTime: number;
  nextSlot: string | null;
  activeOrders: number;
}> {
  const settings = await getSettings();
  const openingTime = settings.openingTime ?? "08:00";
  const closingTime = settings.closingTime ?? "18:00";

  const now = new Date();
  const [oh, om] = openingTime.split(":").map(Number);
  const [ch, cm] = closingTime.split(":").map(Number);
  const openMinutes = (oh || 8) * 60 + (om || 0);
  const closeMinutes = (ch || 18) * 60 + (cm || 0);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isOpen = nowMinutes >= openMinutes && nowMinutes < closeMinutes;

  let activeOrders = mockStore.orders.filter((o) =>
    ["PENDING", "CONFIRMED", "PREPARING"].includes(o.status)
  ).length;

  try {
    const dbActiveOrders = await prisma.order.count({
      where: {
        status: { in: ["PENDING", "CONFIRMED", "PREPARING"] },
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });
    activeOrders = Math.max(activeOrders, dbActiveOrders);
  } catch {
    // fallback
  }

  let rushLevel = "LOW";
  if (activeOrders >= 30) rushLevel = "VERY_BUSY";
  else if (activeOrders >= 20) rushLevel = "BUSY";
  else if (activeOrders >= 10) rushLevel = "MODERATE";

  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const nextSlot =
    mockStore.pickupSlots.find(
      (s) => s.startTime > currentTime && s.currentCount < s.maxOrders
    ) ?? mockStore.pickupSlots[0];

  const avgPrepTime = parseInt(settings.avgPrepTime ?? settings.minPreparationTime ?? "12", 10);

  return {
    isOpen,
    openingTime,
    closingTime,
    rushLevel,
    avgPrepTime,
    nextSlot: nextSlot ? `${nextSlot.startTime}–${nextSlot.endTime}` : "12:00–12:10",
    activeOrders,
  };
}

/** Admin: update settings */
export async function updateSettings(
  updates: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  // Update mockStore
  Object.assign(mockStore.settings, updates);

  try {
    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value, label: key },
        })
      )
    );
  } catch {
    // mockStore already updated
  }

  return { success: true };
}


/** Admin: analytics summary */
export async function getAnalytics() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return null;

  // Realistic mock analytics
  const mockAnalytics = {
    todayOrders: 42,
    todayCompleted: 38,
    todayRevenue: 14250,
    todayCancelled: 2,
    cancellationRate: "4.8",
    totalUsers: mockStore.users.filter((u) => u.role === "STUDENT").length || 3,
    popularItems: [
      { menuItemId: "item_1", itemName: "Chicken Biryani", _sum: { quantity: 18 } },
      { menuItemId: "item_23", itemName: "Chai (Doodh Patti)", _sum: { quantity: 34 } },
      { menuItemId: "item_6", itemName: "Zinger Burger", _sum: { quantity: 15 } },
      { menuItemId: "item_15", itemName: "French Fries", _sum: { quantity: 22 } },
      { menuItemId: "item_12", itemName: "Chicken Roll", _sum: { quantity: 19 } },
    ],
    ordersByHour: [
      { hour: 9, count: 4 },
      { hour: 10, count: 6 },
      { hour: 11, count: 9 },
      { hour: 12, count: 18 },
      { hour: 13, count: 24 },
      { hour: 14, count: 12 },
      { hour: 15, count: 7 },
      { hour: 16, count: 5 },
    ],
    revenueByDay: [
      { date: "2026-09-08", revenue: 11200 },
      { date: "2026-09-09", revenue: 13450 },
      { date: "2026-09-10", revenue: 15100 },
      { date: "2026-09-11", revenue: 14800 },
      { date: "2026-09-12", revenue: 9500 },
      { date: "2026-09-13", revenue: 16200 },
      { date: "2026-09-14", revenue: 14250 },
    ],
    statusBreakdown: [
      { status: "PENDING", _count: 3 },
      { status: "CONFIRMED", _count: 4 },
      { status: "PREPARING", _count: 6 },
      { status: "READY", _count: 2 },
      { status: "COMPLETED", _count: 38 },
      { status: "CANCELLED", _count: 2 },
    ],
  };

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      todayOrders,
      todayCompleted,
      todayRevenue,
      todayCancelled,
      totalUsers,
      popularItems,
      ordersByHour,
      revenueByDay,
      statusBreakdown,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.order.count({
        where: { createdAt: { gte: today, lt: tomorrow }, status: "COMPLETED" },
      }),
      prisma.payment.aggregate({
        where: {
          order: { createdAt: { gte: today, lt: tomorrow }, status: "COMPLETED" },
          status: "PAID",
        },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { createdAt: { gte: today, lt: tomorrow }, status: "CANCELLED" },
      }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.orderItem.groupBy({
        by: ["menuItemId", "itemName"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 8,
      }),
      prisma.$queryRaw<{ hour: number; count: number }[]>`
        SELECT EXTRACT(HOUR FROM "createdAt") as hour, COUNT(*)::int as count
        FROM "Order"
        WHERE "createdAt" >= ${today} AND "createdAt" < ${tomorrow}
        GROUP BY hour
        ORDER BY hour
      `,
      prisma.$queryRaw<{ date: string; revenue: number }[]>`
        SELECT DATE("createdAt") as date, COALESCE(SUM(p.total), 0)::float as revenue
        FROM "Order" o
        LEFT JOIN "Payment" p ON p."orderId" = o.id AND p.status = 'PAID'
        WHERE o."createdAt" >= NOW() - INTERVAL '7 days'
          AND o.status = 'COMPLETED'
        GROUP BY DATE("createdAt")
        ORDER BY date
      `,
      prisma.order.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const todayRevenueVal = parseFloat(todayRevenue._sum.total?.toString() ?? "0");
    const cancellationRate =
      todayOrders > 0 ? ((todayCancelled / todayOrders) * 100).toFixed(1) : "0";

    return {
      todayOrders,
      todayCompleted,
      todayRevenue: todayRevenueVal,
      todayCancelled,
      cancellationRate,
      totalUsers,
      popularItems,
      ordersByHour,
      revenueByDay,
      statusBreakdown,
    };
  } catch {
    return mockAnalytics;
  }
}
