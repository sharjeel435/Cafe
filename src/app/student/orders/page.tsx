import { getStudentOrders } from "@/server/actions/orders";
import { OrdersClient } from "@/features/orders/orders-client";

export const metadata = { title: "My Orders" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab === "past" || params.tab === "cancelled" ? params.tab : "active";

  const orders = await getStudentOrders(tab);

  return <OrdersClient orders={orders} activeTab={tab} />;
}
