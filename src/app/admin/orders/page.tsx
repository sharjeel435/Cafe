import { prisma } from '@/lib/prisma';
import { serialize } from '@/lib/serialize';
import { AdminOrdersClient } from '@/features/admin/admin-orders-client';
export const metadata = { title: 'All orders — Admin' };
export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ include: { user: { select: { name: true, email: true } }, items: true, payment: true, pickupSlot: true }, orderBy: { createdAt: 'desc' }, take: 200 });
  return <AdminOrdersClient orders={serialize(orders)} />;
}
