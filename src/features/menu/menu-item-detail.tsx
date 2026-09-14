"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { addToCart } from "@/server/actions/cart";
import { toast } from "@/components/ui/toast";
import type { MenuItem, MenuCategory, MenuItemOption } from "@/types/models";

type FullMenuItem = MenuItem & {
  category: MenuCategory;
  options: MenuItemOption[];
};

export function MenuItemDetail({ item, publicView = false }: { item: FullMenuItem; publicView?: boolean }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [specialNote, setSpecialNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Group options by groupName
  const optionGroups = item.options.reduce<Record<string, MenuItemOption[]>>(
    (acc, opt) => {
      if (!acc[opt.groupName]) acc[opt.groupName] = [];
      acc[opt.groupName].push(opt);
      return acc;
    },
    {}
  );

  const basePrice = parseFloat(item.price.toString());
  const extraPrice = selectedOptions.reduce((acc, optId) => {
    const opt = item.options.find((o) => o.id === optId);
    return acc + parseFloat(opt?.extraPrice.toString() ?? "0");
  }, 0);
  const totalPrice = (basePrice + extraPrice) * quantity;

  const toggleOption = (optId: string, groupName: string) => {
    // For "Spice Level" style groups — single select within group
    const groupOptions = optionGroups[groupName].map((o) => o.id);
    setSelectedOptions((prev) => {
      const withoutGroup = prev.filter((id) => !groupOptions.includes(id));
      if (prev.includes(optId)) return withoutGroup;
      return [...withoutGroup, optId];
    });
  };

  const handleAddToCart = async () => {
    if (!item.isAvailable) return;
    if (publicView) { router.push(`/login?callbackUrl=/student/menu/${item.id}`); return; }
    setLoading(true);

    const result = await addToCart(
      item.id,
      quantity,
      selectedOptions,
      specialNote || undefined
    );

    setLoading(false);

    if (result.success) {
      toast.success(`${item.name} added to cart`);
      router.push("/student/menu");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="pb-32">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 py-4"
      >
        <ArrowLeft size={18} />
        Back to menu
      </button>

      {/* Image */}
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-56 object-cover rounded-2xl mb-5"
        />
      ) : (
        <div className="w-full h-56 bg-orange-50 rounded-2xl flex items-center justify-center text-7xl mb-5">
          🍽️
        </div>
      )}

      {/* Category + Name */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="orange">{item.category.name}</Badge>
        <Badge variant={item.isAvailable ? "success" : "danger"}>
          {item.isAvailable ? "Available" : "Sold out"}
        </Badge>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{item.name}</h1>
      {item.description && (
        <p className="text-gray-500 text-sm mb-3">{item.description}</p>
      )}

      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl font-bold text-orange-600">
          {formatPrice(item.price.toString())}
        </span>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock size={14} />
          ~{item.preparationTime} min prep
        </div>
      </div>

      {/* Options */}
      {Object.entries(optionGroups).map(([groupName, options]) => (
        <div key={groupName} className="mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            {groupName}
          </h3>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleOption(opt.id, groupName)}
                className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
                  selectedOptions.includes(opt.id)
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                {opt.optionName}
                {parseFloat(opt.extraPrice.toString()) > 0 && (
                  <span className="ml-1 text-xs text-gray-400">
                    +{formatPrice(opt.extraPrice.toString())}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Special instructions */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Special Instructions
          <span className="font-normal text-gray-400 ml-1">(optional)</span>
        </label>
        <textarea
          value={specialNote}
          onChange={(e) => setSpecialNote(e.target.value)}
          placeholder='e.g. "No onions", "Extra spicy"'
          maxLength={200}
          rows={2}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
      </div>

      {/* Sticky footer */}
      <div className={`fixed ${publicView ? "bottom-0" : "bottom-16"} inset-x-0 z-30 bg-white border-t border-gray-100 p-4 safe-bottom`}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          {/* Quantity */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="w-6 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            loading={loading}
            disabled={!item.isAvailable}
            fullWidth
            size="lg"
            className="flex-1"
          >
            <ShoppingCart size={18} />
            Add to Cart · {formatPrice(totalPrice.toFixed(2))}
          </Button>
        </div>
      </div>
    </div>
  );
}
