import { notFound } from "next/navigation";
import { getMenuItem } from "@/server/actions/menu";
import { MenuItemDetail } from "@/features/menu/menu-item-detail";

export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getMenuItem(id);

  if (!item) notFound();

  return <MenuItemDetail item={item} />;
}
