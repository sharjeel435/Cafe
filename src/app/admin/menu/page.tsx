import { getMenuItems, getCategories } from "@/server/actions/menu";
import { AdminMenuClient } from "@/features/admin/admin-menu-client";

export const metadata = { title: "Menu — Admin" };

export default async function AdminMenuPage() {
  const [items, categories] = await Promise.all([getMenuItems(), getCategories()]);
  return <AdminMenuClient items={items} categories={categories} />;
}
