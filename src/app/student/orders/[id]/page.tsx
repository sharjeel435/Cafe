import { getOrder } from "@/server/actions/orders";
import { notFound } from "next/navigation";
import { OrderDetailClient } from "@/features/orders/order-detail-client";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) notFound();

  return <OrderDetailClient order={order} />;
}
