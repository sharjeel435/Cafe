import { notFound } from "next/navigation";
import { getMenuItem } from "@/server/actions/menu";
import { MenuItemDetail } from "@/features/menu/menu-item-detail";
import { sampleMenu } from "@/lib/sample-menu";
import { SampleMenuNotice } from "@/components/ui/sample-menu-notice";

export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sampleView = id.startsWith("sample-");
  const item = sampleView ? sampleMenu.find((item) => item.id === id) : await getMenuItem(id);

  if (!item) notFound();

  return <>{sampleView && <SampleMenuNotice />}<MenuItemDetail publicView sampleView={sampleView} item={item} /></>;
}
