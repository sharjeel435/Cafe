import { getNotifications } from "@/server/actions/notifications";
import { markAllRead } from "@/server/actions/notifications";
import { NotificationsClient } from "@/features/notifications/notifications-client";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const notifications = await getNotifications(30);
  await markAllRead();
  return <NotificationsClient notifications={notifications} />;
}
