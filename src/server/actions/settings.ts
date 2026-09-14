"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { actionError, campusClock, toMinutes } from "@/lib/order-helpers";
import { defaultSettings } from "@/lib/default-settings";
import { ensurePickupSlots } from "@/lib/pickup-slots";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: Object.keys(defaultSettings) } },
  });
  return {
    ...defaultSettings,
    ...Object.fromEntries(rows.map((row) => [row.key, row.value])),
  };
}
export async function getCafeteriaStatus() {
  const [settings, slots, activeOrders] = await Promise.all([
    getSettings(),
    ensurePickupSlots(),
    prisma.order.count({
      where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING"] } },
    }),
  ]);
  const clock = campusClock();
  const next = slots.find((slot) => !slot.isFull);
  return {
    isOpen:
      clock.minutes >= toMinutes(settings.openTime) &&
      clock.minutes < toMinutes(settings.closeTime),
    openingTime: settings.openTime,
    closingTime: settings.closeTime,
    rushLevel:
      activeOrders >= 30
        ? "VERY_BUSY"
        : activeOrders >= 20
          ? "BUSY"
          : activeOrders >= 10
            ? "MODERATE"
            : "LOW",
    avgPrepTime: Number(settings.avgPrepTime),
    nextSlot: next ? `${next.startTime}–${next.endTime}` : null,
    activeOrders,
  };
}
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const numeric = (min: number, max: number) =>
  z
    .string()
    .regex(/^\d+$/)
    .refine((value) => Number(value) >= min && Number(value) <= max);
const settingsSchema = z
  .object({
    cafeteriaName: z.string().trim().min(2).max(100),
    openTime: time,
    closeTime: time,
    serviceFee: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .refine((value) => Number(value) <= 100),
    slotDuration: numeric(5, 60),
    maxOrdersPerSlot: numeric(1, 100),
    avgPrepTime: numeric(1, 120),
    minPreparationTime: numeric(1, 120),
    cancellationCutoff: z.enum(["PENDING", "CONFIRMED", "PREPARING"]),
    cashEnabled: z.enum(["true", "false"]),
    walletEnabled: z.enum(["true", "false"]),
    rushHourStart: time,
    rushHourEnd: time,
  })
  .strict()
  .refine(
    (value) => value.openTime < value.closeTime,
    "Closing time must be later than opening time",
  )
  .refine(
    (value) => value.rushHourStart < value.rushHourEnd,
    "Rush hour end must be later than its start",
  )
  .refine(
    (value) => value.cashEnabled === "true" || value.walletEnabled === "true",
    "Enable at least one payment method",
  );
export async function updateSettings(
  updates: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };
  try {
    const parsed = settingsSchema.safeParse({
      ...(await getSettings()),
      ...updates,
    });
    if (!parsed.success)
      return { success: false, error: parsed.error.issues[0].message };
    await prisma.$transaction(
      Object.entries(parsed.data).map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value, label: key },
        }),
      ),
    );
    for (const path of ["/admin/settings", "/student", "/menu"])
      revalidatePath(path, "layout");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}
export async function getAnalytics() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return null;
  const { start: today, end: tomorrow } = campusClock();
  const since = new Date(today.getTime() - 6 * 86400000);
  const [
    todayOrders,
    todayCompleted,
    revenue,
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
        status: "PAID",
        order: { status: "COMPLETED", createdAt: { gte: today, lt: tomorrow } },
      },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { createdAt: { gte: today, lt: tomorrow }, status: "CANCELLED" },
    }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.orderItem.groupBy({
      by: ["menuItemId", "itemName"],
      where: { order: { status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    prisma.$queryRaw<
      { hour: number; count: number }[]
    >`SELECT EXTRACT(HOUR FROM ("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi'))::int AS hour, COUNT(*)::int AS count FROM "Order" WHERE "createdAt" >= ${today} AND "createdAt" < ${tomorrow} GROUP BY hour ORDER BY hour`,
    prisma.$queryRaw<
      { date: string; revenue: number }[]
    >`SELECT TO_CHAR(o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi', 'YYYY-MM-DD') AS date, COALESCE(SUM(p.total), 0)::float AS revenue FROM "Order" o JOIN "Payment" p ON p."orderId" = o.id AND p.status = 'PAID' WHERE o."createdAt" >= ${since} AND o."createdAt" < ${tomorrow} AND o.status = 'COMPLETED' GROUP BY date ORDER BY date`,
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  return {
    todayOrders,
    todayCompleted,
    todayRevenue: Number(revenue._sum.total ?? 0),
    todayCancelled,
    cancellationRate: todayOrders
      ? ((todayCancelled / todayOrders) * 100).toFixed(1)
      : "0",
    totalUsers,
    popularItems,
    ordersByHour,
    revenueByDay,
    statusBreakdown,
  };
}
