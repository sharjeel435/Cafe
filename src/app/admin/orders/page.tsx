import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { AdminOrdersClient } from "@/features/admin/admin-orders-client";

export const metadata = { title: "All Orders — Admin" };

export default async function AdminOrdersPage() {
  const mockOrders = mockStore.orders.map((o) => ({
    ...o,
    cancelledAt: o.cancelledAt,
    user: { name: o.user.name, email: o.user.email },
  }));

  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        items: true,
        payment: true,
        pickupSlot: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return <AdminOrdersClient orders={orders.length > 0 ? (orders as any) : (mockOrders as any)} />;
  } catch {
    return <AdminOrdersClient orders={mockOrders as any} />;
  }
}
