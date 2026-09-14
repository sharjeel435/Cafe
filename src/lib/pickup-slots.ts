import { prisma } from "@/lib/prisma";
import { campusClock, toMinutes, toTime } from "@/lib/order-helpers";
export async function ensurePickupSlots(now = new Date()) {
  const rows = await prisma.systemSetting.findMany();
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const clock = campusClock(now);
  const open = toMinutes(settings.openTime ?? "08:00");
  const close = toMinutes(settings.closeTime ?? "18:00");
  const duration = Number(settings.slotDuration ?? 10);
  const capacity = Number(settings.maxOrdersPerSlot ?? 20);
  const prep = Number(settings.avgPrepTime ?? 12);
  if (
    !Number.isInteger(duration) ||
    duration < 5 ||
    duration > 60 ||
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    capacity > 100 ||
    !Number.isFinite(open) ||
    !Number.isFinite(close) ||
    close <= open ||
    !Number.isFinite(prep)
  )
    return [];
  const times: string[] = [];
  const data = [];
  for (let start = open; start + duration <= close; start += duration) {
    times.push(toTime(start));
    data.push({
      date: clock.date,
      startTime: toTime(start),
      endTime: toTime(start + duration),
      maxOrders: capacity,
    });
  }
  await prisma.pickupSlot.createMany({ data, skipDuplicates: true });
  const slots = await prisma.pickupSlot.findMany({
    where: {
      date: clock.date,
      isActive: true,
      endTime: { lte: toTime(close) },
      startTime: { in: times, gte: toTime(clock.minutes + prep) },
    },
    orderBy: { startTime: "asc" },
  });
  return slots.map((slot) => ({
    ...slot,
    isFull: slot.currentCount >= slot.maxOrders,
    spotsLeft: Math.max(0, slot.maxOrders - slot.currentCount),
  }));
}
