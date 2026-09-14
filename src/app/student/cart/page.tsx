import { getCart } from "@/server/actions/cart";
import { CartClient } from "@/features/cart/cart-client";

export const metadata = { title: "My Cart" };

export default async function CartPage() {
  const cart = await getCart();
  return <CartClient cart={cart} />;
}
