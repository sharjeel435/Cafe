import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StaffSidebar } from "@/components/layout/staff-sidebar";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || (session.user.role !== "STAFF" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StaffSidebar user={session.user} />
      <main className="flex-1 md:ml-56 p-4 md:p-6 max-w-5xl">{children}</main>
    </div>
  );
}
