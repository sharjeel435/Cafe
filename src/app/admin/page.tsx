import { getAnalytics } from "@/server/actions/settings";
import { AdminDashboardClient } from "@/features/admin/admin-dashboard-client";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const analytics = await getAnalytics();
  return <AdminDashboardClient analytics={analytics} />;
}
