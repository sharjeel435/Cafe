import { prisma } from '@/lib/prisma';
import { AdminUsersClient } from '@/features/admin/admin-users-client';
export const metadata = { title: 'Users — Admin' };
export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true, studentProfile: true, wallet: { select: { balance: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
  return <AdminUsersClient users={users} />;
}
