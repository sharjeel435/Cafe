import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/server/actions/auth";
import { User, Mail, Phone, CreditCard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const profile = await getUserProfile(session.user.id);

  return (
    <div className="py-4 space-y-4">
      {/* Avatar + name */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white text-center">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <User size={28} className="text-white" />
        </div>
        <h1 className="text-xl font-bold">{profile?.name ?? session.user.name}</h1>
        <p className="text-orange-100 text-sm mt-1">Student</p>
        {profile?.studentProfile?.studentId && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
            <CreditCard size={12} />
            {profile.studentProfile.studentId}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        <div className="flex items-center gap-3 p-4">
          <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
            <Mail size={15} className="text-orange-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Email</div>
            <div className="text-sm font-medium text-gray-900">{session.user.email}</div>
          </div>
        </div>
        {profile?.studentProfile?.phone && (
          <div className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
              <Phone size={15} className="text-orange-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Phone</div>
              <div className="text-sm font-medium text-gray-900">{profile.studentProfile.phone}</div>
            </div>
          </div>
        )}
      </div>

      {/* Sign out */}
      <form action="/api/auth/signout" method="post">
        <Button type="submit" variant="outline" fullWidth>
          <LogOut size={16} />
          Sign Out
        </Button>
      </form>
    </div>
  );
}
