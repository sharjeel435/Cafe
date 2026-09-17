import { Suspense } from "react";
import { getMenuItems, getCategories } from "@/server/actions/menu";
import { MenuClient } from "@/features/menu/menu-client";
import { MenuCardSkeleton } from "@/components/ui/skeleton";
import { filterSampleMenu, sampleCategories } from "@/lib/sample-menu";
import { SampleMenuNotice } from "@/components/ui/sample-menu-notice";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu" };

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; available?: string }>;
}) {
  const params = await searchParams;

  const { items, categories, sampleView } = await Promise.all([
    getMenuItems({
      categorySlug: params.category,
      search: params.search,
      availableOnly: params.available === "1",
    }),
    getCategories(),
  ]).then(([items, categories]) => ({ items, categories, sampleView: false }))
    .catch(() => ({ items: filterSampleMenu(params), categories: sampleCategories, sampleView: true }));

  return (
    <div className="py-4">
      {sampleView && <SampleMenuNotice />}
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
          sampleView={sampleView}
          initialItems={items}
          categories={categories}
          initialParams={params}
        />
      </Suspense>
    </div>
  );
}
