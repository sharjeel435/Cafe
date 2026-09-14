"use server";

import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { auth } from "@/lib/auth";

/** Get notifications for current user */
export async function getNotifications(limit = 20) {
  const session = await auth();
  if (!session) return [];

  const mockNotifs = mockStore.notifications.filter(
    (n) => n.userId === session.user.id
  );
  if (mockNotifs.length > 0) {
    return mockNotifs.slice(0, limit);
  }

  try {
    return await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch {
    return mockNotifs;
  }
}

/** Get unread count */
export async function getUnreadCount(): Promise<number> {
  const session = await auth();
  if (!session) return 0;

  const mockUnread = mockStore.notifications.filter(
    (n) => n.userId === session.user.id && !n.isRead
  ).length;
  if (mockUnread > 0) return mockUnread;

  try {
    return await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });
  } catch {
    return mockUnread;
  }
}

/** Mark all as read */
export async function markAllRead(): Promise<void> {
  const session = await auth();
  if (!session) return;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
}

/** Mark single notification as read */
export async function markNotificationRead(id: string): Promise<void> {
  const session = await auth();
  if (!session) return;

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });
}
