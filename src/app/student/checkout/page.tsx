import { campusClock, toMinutes } from "@/lib/order-helpers";
import { getCart } from "@/server/actions/cart";
import { getAvailablePickupSlots } from "@/server/actions/orders";
import { getWallet } from "@/server/actions/wallet";
import { getSettings } from "@/server/actions/settings";
import { CheckoutClient } from "@/features/checkout/checkout-client";
import { redirect } from "next/navigation";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [cart, slots, wallet, settings] = await Promise.all([
    getCart(),
    getAvailablePickupSlots(),
    getWallet(),
    getSettings(),
  ]);

  if (!cart || cart.items.length === 0) {
    redirect("/student/cart");
  }

  return (
    <CheckoutClient
      cart={cart}
      slots={slots.filter(slot => toMinutes(slot.startTime) >= campusClock().minutes + Math.max(...cart.items.map(item => item.menuItem.preparationTime)))}
      walletBalance={wallet?.balance ?? 0}
      settings={settings}
    />
  );
}
