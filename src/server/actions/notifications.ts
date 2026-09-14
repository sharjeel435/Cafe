"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
export async function getNotifications(limit = 20) {
  const session = await auth();
  if (!session) return [];
  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: Number.isInteger(limit) ? Math.max(1, Math.min(100, limit)) : 20,
  });
}
export async function getUnreadCount() {
  const session = await auth();
  if (!session) return 0;
  return prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });
}
export async function markAllRead() {
  const session = await auth();
  if (!session) return;
  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/student", "layout");
}
export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session) return;
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });
  revalidatePath("/student", "layout");
}
