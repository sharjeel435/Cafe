"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { paisaToRupees, formatDate } from "@/lib/utils";
import { adminAddWalletCredit } from "@/server/actions/wallet";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import type { User, StudentProfile, Wallet } from "@prisma/client";

type UserWithProfile = User & {
  studentProfile: StudentProfile | null;
  wallet: Pick<Wallet, "balance"> | null;
};

const ROLE_BADGE: Record<string, "default" | "orange" | "danger"> = {
  STUDENT: "default",
  STAFF: "orange",
  ADMIN: "danger",
};

export function AdminUsersClient({ users }: { users: UserWithProfile[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [topping, setTopping] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState("500");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.studentProfile?.studentId?.includes(search)
  );

  const handleTopup = async (userId: string) => {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }
    setTopping(userId);
    const result = await adminAddWalletCredit(userId, amount);
    setTopping(null);
    if (result.success) {
      toast.success(`Added Rs. ${amount} to wallet`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Users ({users.length})</h1>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or student ID…"
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Wallet</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Top-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  {user.studentProfile?.studentId && (
                    <div className="text-xs text-gray-400">{user.studentProfile.studentId}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={ROLE_BADGE[user.role] ?? "default"}>
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {user.wallet ? paisaToRupees(user.wallet.balance) : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {user.wallet && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        defaultValue={500}
                        min={50}
                        max={10000}
                        step={50}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        className="w-20 h-7 px-2 text-xs rounded-lg border border-gray-200 focus:outline-none"
                      />
                      <button
                        onClick={() => handleTopup(user.id)}
                        disabled={topping === user.id}
                        className="px-2 h-7 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                      >
                        {topping === user.id ? "…" : "Add"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
