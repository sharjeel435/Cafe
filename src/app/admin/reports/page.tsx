import { getAnalytics } from "@/server/actions/settings";
import { AdminDashboardClient } from "@/features/admin/admin-dashboard-client";

export const metadata = { title: "Reports — Admin" };

export default async function AdminReportsPage() {
  const analytics = await getAnalytics();
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Reports & Analytics</h1>
      <AdminDashboardClient analytics={analytics} />
    </div>
  );
}
