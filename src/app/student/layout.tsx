import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentBottomNav } from "@/components/layout/student-bottom-nav";
import { StudentTopBar } from "@/components/layout/student-topbar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentTopBar user={session.user} />
      <main className="pb-24 pt-2 max-w-2xl mx-auto px-4">{children}</main>
      <StudentBottomNav />
    </div>
  );
}
