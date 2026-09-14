import { getSettings } from "@/server/actions/settings";
import { AdminSettingsClient } from "@/features/admin/admin-settings-client";

export const metadata = { title: "Settings — Admin" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return <AdminSettingsClient settings={settings} />;
}
