import { getMenuItems, getCategories } from "@/server/actions/menu";
import { StaffMenuClient } from "@/features/staff/staff-menu-client";

export const metadata = { title: "Menu — Staff" };

export default async function StaffMenuPage() {
  const [items, categories] = await Promise.all([
    getMenuItems(),
    getCategories(),
  ]);

  return <StaffMenuClient items={items} categories={categories} />;
}
