"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToggleLeft, ToggleRight, Plus, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { toggleItemAvailability } from "@/server/actions/menu";
import { toast } from "@/components/ui/toast";
import type { MenuItem, MenuCategory } from "@prisma/client";

type MenuItemWithCategory = MenuItem & { category: MenuCategory };

export function StaffMenuClient({
  items,
  categories,
}: {
  items: MenuItemWithCategory[];
  categories: MenuCategory[];
}) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState("");

  const filtered = selectedCat
    ? items.filter((i) => i.category.slug === selectedCat)
    : items;

  const handleToggle = async (itemId: string, current: boolean) => {
    setTogglingId(itemId);
    const result = await toggleItemAvailability(itemId, !current);
    if (result.success) {
      toast.success(!current ? "Item marked available" : "Item marked unavailable");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setTogglingId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Menu Management</h1>
        <Button size="sm">
          <Plus size={15} />
          Add Item
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        <button
          onClick={() => setSelectedCat("")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !selectedCat
              ? "bg-orange-500 text-white"
              : "bg-white border border-gray-200 text-gray-600"
          }`}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.slug)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCat === cat.slug
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Items table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Item</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Price</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Prep</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 line-clamp-1">{item.name}</div>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                  {item.category.emoji} {item.category.name}
                </td>
                <td className="px-4 py-3 font-semibold text-orange-600">
                  {formatPrice(item.price.toString())}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                  {item.preparationTime}m
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(item.id, item.isAvailable)}
                    disabled={togglingId === item.id}
                    className="flex items-center gap-1.5 transition-opacity disabled:opacity-50"
                    aria-label={item.isAvailable ? "Mark unavailable" : "Mark available"}
                  >
                    {item.isAvailable ? (
                      <>
                        <ToggleRight size={22} className="text-green-500" />
                        <span className="text-xs font-medium text-green-600">Available</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={22} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">Unavailable</span>
                      </>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
