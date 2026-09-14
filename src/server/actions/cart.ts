"use server";

import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { auth } from "@/lib/auth";
import type { ActionResult } from "./auth";

/** Get or create cart for current user */
export async function getCart() {
  const session = await auth();
  if (!session) return null;

  // In-memory mock cart
  let mockCart = mockStore.carts.get(session.user.id);
  if (!mockCart) {
    mockCart = {
      id: `cart_${session.user.id}`,
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    };
    mockStore.carts.set(session.user.id, mockCart);
  }

  // If in-memory cart has items or no database is reached
  if (mockCart.items.length > 0) {
    return mockCart;
  }

  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { menuItem: { include: { category: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: {
          items: {
            include: { menuItem: { include: { category: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    return cart;
  } catch {
    return mockCart;
  }
}

/** Add item to cart */
export async function addToCart(
  menuItemId: string,
  quantity: number = 1,
  selectedOptions: string[] = [],
  specialNote?: string
): Promise<ActionResult<{ itemId: string }>> {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    return { success: false, error: "Unauthorized" };
  }

  // 1. Check in mockStore
  const mockItem = mockStore.menuItems.find((i) => i.id === menuItemId);
  if (mockItem) {
    if (!mockItem.isAvailable) {
      return { success: false, error: "This item is currently unavailable" };
    }

    let mockCart = mockStore.carts.get(session.user.id);
    if (!mockCart) {
      mockCart = {
        id: `cart_${session.user.id}`,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
      };
      mockStore.carts.set(session.user.id, mockCart);
    }

    const existing = mockCart.items.find(
      (it) =>
        it.menuItemId === menuItemId &&
        JSON.stringify(it.selectedOptions) === JSON.stringify(selectedOptions)
    );

    if (existing) {
      existing.quantity += quantity;
      return { success: true, data: { itemId: existing.id } };
    } else {
      const newItemId = `ci_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      mockCart.items.push({
        id: newItemId,
        cartId: mockCart.id,
        menuItemId,
        quantity,
        selectedOptions,
        specialNote: specialNote ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        menuItem: mockItem,
      });
      return { success: true, data: { itemId: newItemId } };
    }
  }

  // 2. Fallback to Prisma
  try {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem || !menuItem.isActive) {
      return { success: false, error: "Item not found" };
    }

    if (!menuItem.isAvailable) {
      return { success: false, error: "This item is currently unavailable" };
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
      });
    }

    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        menuItemId,
      },
    });

    let cartItem;
    if (existing) {
      cartItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId,
          quantity,
          selectedOptions,
          specialNote,
        },
      });
    }

    return { success: true, data: { itemId: cartItem.id } };
  } catch {
    return { success: false, error: "Failed to add item" };
  }
}

/** Update cart item quantity */
export async function updateCartItem(
  cartItemId: string,
  quantity: number
): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  // Check mock store
  const mockCart = mockStore.carts.get(session.user.id);
  if (mockCart) {
    const idx = mockCart.items.findIndex((it) => it.id === cartItemId);
    if (idx !== -1) {
      if (quantity <= 0) {
        mockCart.items.splice(idx, 1);
      } else {
        mockCart.items[idx].quantity = quantity;
      }
      return { success: true, data: undefined };
    }
  }

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== session.user.id) {
      return { success: false, error: "Not found" };
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });
    }

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update cart" };
  }
}

/** Remove item from cart */
export async function removeCartItem(cartItemId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const mockCart = mockStore.carts.get(session.user.id);
  if (mockCart) {
    const idx = mockCart.items.findIndex((it) => it.id === cartItemId);
    if (idx !== -1) {
      mockCart.items.splice(idx, 1);
      return { success: true, data: undefined };
    }
  }

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== session.user.id) {
      return { success: false, error: "Not found" };
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to remove item" };
  }
}

/** Clear entire cart */
export async function clearCart(): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const mockCart = mockStore.carts.get(session.user.id);
  if (mockCart) {
    mockCart.items = [];
    return { success: true, data: undefined };
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) return { success: true, data: undefined };

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { success: true, data: undefined };
  } catch {
    return { success: true, data: undefined };
  }
}
