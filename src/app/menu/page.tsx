import { Suspense } from "react";
import { getMenuItems, getCategories } from "@/server/actions/menu";
import { MenuClient } from "@/features/menu/menu-client";
import { MenuCardSkeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu" };

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; available?: string }>;
}) {
  const params = await searchParams;

  const [items, categories] = await Promise.all([
    getMenuItems({
      categorySlug: params.category,
      search: params.search,
      availableOnly: params.available === "1",
    }),
    getCategories(),
  ]);

  return (
    <div className="py-4">
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3 mt-16">
            {Array.from({ length: 6 }).map((_, i) => (
              <MenuCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <MenuClient
          key={JSON.stringify(params)}
          publicView
          initialItems={items}
          categories={categories}
          initialParams={params}
        />
      </Suspense>
    </div>
  );
}
