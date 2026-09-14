"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/utils";
import { updateCartItem, removeCartItem, clearCart } from "@/server/actions/cart";
import { toast } from "@/components/ui/toast";
import type { Cart, CartItem, MenuItem, MenuCategory } from "@/types/models";

type FullCart = Cart & {
  items: (CartItem & { unitPricePaisa: number;
    menuItem: MenuItem & { category: MenuCategory };
  })[];
};

export function CartClient({ cart }: { cart: FullCart | null }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (acc, item) =>
      acc + (item.unitPricePaisa / 100) * item.quantity,
    0
  );

  const handleQty = async (itemId: string, qty: number) => {
    setLoadingId(itemId);
    const result = await updateCartItem(itemId, qty);
    if (!result.success) toast.error(result.error);
    router.refresh();
    setLoadingId(null);
  };

  const handleRemove = async (itemId: string) => {
    setLoadingId(itemId);
    const result = await removeCartItem(itemId);
    if (result.success) toast.success("Item removed"); else toast.error(result.error);
    router.refresh();
    setLoadingId(null);
  };

  const handleClear = async () => {
    setClearing(true);
    const result = await clearCart();
    if (result.success) toast.success("Cart cleared"); else toast.error(result.error);
    router.refresh();
    setClearing(false);
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Your cart is empty"
        description="Add some food from the menu to get started."
        action={
          <Link href="/student/menu">
            <Button>Browse Menu</Button>
          </Link>
        }
        className="py-24"
      />
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">
          Your Cart ({items.length})
        </h1>
        <button
          onClick={handleClear}
          disabled={clearing}
          className="text-sm text-red-500 hover:text-red-600 font-medium"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3"
          >
            {item.menuItem.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.menuItem.imageUrl}
                alt={item.menuItem.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">
                🍽️
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                  {item.menuItem.name}
                </h3>
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={loadingId === item.id}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {item.specialNote && (
                <p className="text-xs text-gray-500 italic mt-0.5">
                  &quot;{item.specialNote}&quot;
                </p>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQty(item.id, item.quantity - 1)}
                    disabled={loadingId === item.id}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    aria-label="Decrease"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="text-sm font-semibold w-5 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQty(item.id, item.quantity + 1)}
                    disabled={loadingId === item.id || item.quantity >= 10}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    aria-label="Increase"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <span className="text-sm font-bold text-orange-600">
                  {formatPrice(
                    (
                      (item.unitPricePaisa / 100) * item.quantity
                    ).toFixed(2)
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-semibold">{formatPrice(subtotal.toFixed(2))}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Service fee</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-orange-600 text-lg">
            {formatPrice(subtotal.toFixed(2))}
          </span>
        </div>
      </div>

      <Link href="/student/checkout">
        <Button fullWidth size="lg">
          <ShoppingBag size={18} />
          Proceed to Checkout
        </Button>
      </Link>
    </div>
  );
}
