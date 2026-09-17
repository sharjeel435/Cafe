import { createDemoState } from "./demo-store";
import type { MenuCategory, MenuItem, MenuItemOption } from "@/types/models";

const date = new Date("2026-01-01T00:00:00Z");
const demo = createDemoState().menu;
export const sampleCategories = [...new Set(demo.map((item) => item.category))].map(
  (name, sortOrder): MenuCategory & { _count: { items: number } } => ({
    id: `sample-${name.toLowerCase()}`, name, slug: name.toLowerCase(),
    emoji: "", sortOrder, isActive: true, createdAt: date, updatedAt: date,
    _count: { items: demo.filter((item) => item.category === name).length },
  }),
);
export const sampleMenu: (MenuItem & { category: MenuCategory; options: MenuItemOption[] })[] = demo.map((item, sortOrder) => {
  const category = sampleCategories.find((category) => category.name === item.category)!;
  return {
    id: `sample-${item.id}`, slug: item.id, name: item.name,
    categoryId: category.id, category, options: [], description: "Sample menu item. Explore ordering with a demo account.",
    price: (item.price / 100).toFixed(2), imageUrl: item.image,
    isAvailable: item.available, isActive: true, preparationTime: 10,
    sortOrder, totalOrdered: 0, createdAt: date, updatedAt: date,
  };
});

export function filterSampleMenu(params: { category?: string; search?: string; available?: string }) {
  const search = params.search?.trim().toLowerCase();
  return sampleMenu.filter((item) =>
    (!params.category || item.category.slug === params.category) &&
    (!search || `${item.name} ${item.description}`.toLowerCase().includes(search)) &&
    (params.available !== "1" || item.isAvailable),
  );
}
