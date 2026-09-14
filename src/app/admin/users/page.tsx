import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { AdminUsersClient } from "@/features/admin/admin-users-client";

export const metadata = { title: "Users — Admin" };

export default async function AdminUsersPage() {
  const mockUsers = mockStore.users.map((u) => {
    const w = mockStore.wallets.get(u.id);
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      password: u.passwordHash,
      role: u.role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      studentProfile: u.studentProfile
        ? {
            id: u.studentProfile.id,
            userId: u.id,
            studentId: u.studentProfile.studentId,
            phone: u.studentProfile.phone,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : null,
      wallet: w ? { balance: w.balance } : null,
    };
  });

  try {
    const users = await prisma.user.findMany({
      include: {
        studentProfile: true,
        wallet: { select: { balance: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return <AdminUsersClient users={users.length > 0 ? (users as any) : (mockUsers as any)} />;
  } catch {
    return <AdminUsersClient users={mockUsers as any} />;
  }
}
