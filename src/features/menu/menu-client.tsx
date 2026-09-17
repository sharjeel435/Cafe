"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/utils";
import { addToCart } from "@/server/actions/cart";
import { toast } from "@/components/ui/toast";
import type { MenuItem, MenuCategory } from "@/types/models";

type MenuItemWithCategory = MenuItem & { category: MenuCategory };

interface MenuClientProps {
  initialItems: MenuItemWithCategory[];
  categories: (MenuCategory & { _count: { items: number } })[];
  publicView?: boolean;
  sampleView?: boolean;
  initialParams: { category?: string; search?: string; available?: string };
}

type SortOption = "popular" | "price-asc" | "price-desc" | "prep-time";

export function MenuClient({ initialItems, categories, initialParams, publicView = false, sampleView = false }: MenuClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialParams.search ?? "");
  const [selectedCategory, setSelectedCategory] = useState(
    initialParams.category ?? ""
  );
  const [availableOnly, setAvailableOnly] = useState(
    initialParams.available === "1"
  );
  const [sort, setSort] = useState<SortOption>("popular");
  const [addingId, setAddingId] = useState<string | null>(null);

  // Client-side sort (server already filtered by category/search/available)
  const sorted = [...initialItems].sort((a, b) => {
    if (sort === "price-asc")
      return parseFloat(a.price.toString()) - parseFloat(b.price.toString());
    if (sort === "price-desc")
      return parseFloat(b.price.toString()) - parseFloat(a.price.toString());
    if (sort === "prep-time") return a.preparationTime - b.preparationTime;
    return b.totalOrdered - a.totalOrdered; // popular (default)
  });

  const updateFilters = useCallback(
    (updates: {
      category?: string;
      search?: string;
      available?: string;
    }) => {
      const params = new URLSearchParams();
      if (updates.category ?? selectedCategory)
        params.set("category", updates.category ?? selectedCategory);
      if (updates.search ?? search)
        params.set("search", updates.search ?? search);
      if (updates.available ?? (availableOnly ? "1" : ""))
        params.set("available", updates.available ?? (availableOnly ? "1" : ""));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, selectedCategory, search, availableOnly]
  );

  const handleAddToCart = async (itemId: string) => {
    if (sampleView) { router.push("/login"); return; }
    if (publicView) { router.push(`/login?callbackUrl=/student/menu/${itemId}`); return; }
    const item = initialItems.find(item => item.id === itemId);
    if (item && "options" in item && Array.isArray(item.options) && item.options.length) { router.push(`/student/menu/${itemId}`); return; }
    setAddingId(itemId);
    try {
    const result = await addToCart(itemId, 1);
    if (result.success) {
      toast.success("Added to cart!");
    } else {
      toast.error(result.error);
    }
    } catch {
      toast.error("Unable to add this item. Please try again.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          aria-label="Search the menu"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateFilters({ search });
          }}
          placeholder="Search dishes, drinks and more — press Enter"
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              updateFilters({ search: "" });
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        <button
          onClick={() => {
            setSelectedCategory("");
            updateFilters({ category: "" });
          }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !selectedCategory
              ? "bg-orange-500 text-white"
              : "bg-white border border-gray-200 text-gray-600"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.slug);
              updateFilters({ category: cat.slug });
            }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.slug
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-gray-500" />
          <span className="text-xs text-gray-500 font-medium">Sort:</span>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(
            [
              { value: "popular", label: "Popular" },
              { value: "price-asc", label: "Price ↑" },
              { value: "price-desc", label: "Price ↓" },
              { value: "prep-time", label: "Fastest" },
            ] as { value: SortOption; label: string }[]
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sort === opt.value
                  ? "bg-orange-100 text-orange-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 ml-auto flex-shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => {
              setAvailableOnly(e.target.checked);
              updateFilters({ available: e.target.checked ? "1" : "" });
            }}
            className="accent-orange-500"
          />
          <span className="text-xs text-gray-600 whitespace-nowrap">
            Available only
          </span>
        </label>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 mb-3">
        {sorted.length} item{sorted.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      {sorted.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No food matched your search"
          description="Try a different keyword or category"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedCategory("");
                setAvailableOnly(false);
                updateFilters({ category: "", search: "", available: "" });
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition hover:shadow-md"
            >
              <Link href={`${publicView ? "/menu" : "/student/menu"}/${item.id}`} className="block">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-44 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-44 bg-orange-50 flex items-center justify-center text-5xl">
                    🍽️
                  </div>
                )}
              </Link>
              <div className="p-4">
                <Link href={`${publicView ? "/menu" : "/student/menu"}/${item.id}`}>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-0.5">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                      {item.description}
                    </p>
                  )}
                </Link>
                <div className="flex items-center gap-1.5 mb-2">
                  <Badge variant={item.isAvailable ? "success" : "danger"}>
                    {item.isAvailable ? "Available" : "Sold out"}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    ~{item.preparationTime}m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-600 text-sm">
                    {formatPrice(item.price.toString())}
                  </span>
                  <button
                    onClick={() => handleAddToCart(item.id)}
                    disabled={!item.isAvailable || addingId !== null}
                    className="h-8 px-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {addingId === item.id ? "Adding…" : "+ Add"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
