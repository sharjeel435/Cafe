"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import { actionError, OrderError, unitPrice } from "@/lib/order-helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth";
const include = {
  items: {
    include: { menuItem: { include: { category: true, options: true } } },
    orderBy: { createdAt: "asc" as const },
  },
};
function refreshCart() {
  revalidatePath("/student", "layout");
}
export async function getCart() {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") return null;
  const cart = await prisma.cart.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
    include,
  });
  return serialize({
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      unitPricePaisa: unitPrice(item.menuItem, item.selectedOptions),
    })),
  });
}
export async function addToCart(
  menuItemId: string,
  quantity = 1,
  selectedOptions: string[] = [],
  specialNote?: string,
): Promise<ActionResult<{ itemId: string }>> {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT")
    return { success: false, error: "Unauthorized" };
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 20 ||
    (specialNote &&
      (typeof specialNote !== "string" || specialNote.length > 300))
  )
    return {
      success: false,
      error: "Choose a quantity from 1 to 20 and a note under 300 characters.",
    };
  try {
    const itemId = await prisma.$transaction(
      async (tx) => {
        const item = await tx.menuItem.findFirst({
          where: {
            id: menuItemId,
            isActive: true,
            isAvailable: true,
            category: { isActive: true },
          },
          include: { options: true },
        });
        if (!item) throw new OrderError("This item is currently unavailable");
        unitPrice(item, selectedOptions);
        const options = [...selectedOptions].sort();
        const note = specialNote?.trim() || null;
        const cart = await tx.cart.upsert({
          where: { userId: session.user.id },
          update: {},
          create: { userId: session.user.id },
        });
        const existing = await tx.cartItem.findFirst({
          where: {
            cartId: cart.id,
            menuItemId,
            selectedOptions: { equals: options },
            specialNote: note,
          },
        });
        if (existing && existing.quantity + quantity > 20)
          throw new OrderError("You can add up to 20 of each item.");
        const result = existing
          ? await tx.cartItem.update({
              where: { id: existing.id },
              data: { quantity: { increment: quantity } },
            })
          : await tx.cartItem.create({
              data: {
                cartId: cart.id,
                menuItemId,
                quantity,
                selectedOptions: options,
                specialNote: note,
              },
            });
        return result.id;
      },
      { isolationLevel: "Serializable" },
    );
    refreshCart();
    return { success: true, data: { itemId } };
  } catch (error) {
    return actionError(error);
  }
}
export async function updateCartItem(
  cartItemId: string,
  quantity: number,
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT")
    return { success: false, error: "Unauthorized" };
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 20)
    return { success: false, error: "Quantity must be between 0 and 20" };
  try {
    const where = { id: cartItemId, cart: { userId: session.user.id } };
    const result =
      quantity === 0
        ? await prisma.cartItem.deleteMany({ where })
        : await prisma.cartItem.updateMany({ where, data: { quantity } });
    if (!result.count) throw new OrderError("Cart item not found");
    refreshCart();
    return { success: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}
export async function removeCartItem(
  cartItemId: string,
): Promise<ActionResult> {
  return updateCartItem(cartItemId, 0);
}
export async function clearCart(): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT")
    return { success: false, error: "Unauthorized" };
  try {
    await prisma.cartItem.deleteMany({
      where: { cart: { userId: session.user.id } },
    });
    refreshCart();
    return { success: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}
