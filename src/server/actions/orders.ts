"use server";

import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generatePickupCode } from "@/lib/utils";
import type { ActionResult } from "./auth";
import type { OrderStatus } from "@prisma/client";

/** Get available pickup slots for today */
export async function getAvailablePickupSlots() {
  if (mockStore.pickupSlots.length > 0) {
    return mockStore.pickupSlots.map((slot) => ({
      ...slot,
      isFull: slot.currentCount >= slot.maxOrders,
      spotsLeft: slot.maxOrders - slot.currentCount,
    }));
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const slots = await prisma.pickupSlot.findMany({
      where: {
        date: today,
        isActive: true,
        // Only show future slots
        startTime: {
          gte: new Date().toLocaleTimeString("en-PK", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        },
      },
      orderBy: { startTime: "asc" },
    });

    return slots.map((slot) => ({
      ...slot,
      isFull: slot.currentCount >= slot.maxOrders,
      spotsLeft: slot.maxOrders - slot.currentCount,
    }));
  } catch {
    return [];
  }
}

/** Create order with atomic transaction */
export async function createOrder(data: {
  pickupSlotId: string;
  paymentMethod: "CASH" | "WALLET";
  specialNote?: string;
}): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    return { success: false, error: "Unauthorized" };
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Get cart
    const cart = await tx.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Your cart is empty");
    }

    // 2. Verify all items are still available
    for (const item of cart.items) {
      if (!item.menuItem.isAvailable || !item.menuItem.isActive) {
        throw new Error(`"${item.menuItem.name}" is no longer available`);
      }
    }

    // 3. Lock and verify pickup slot with row-level lock
    const slot = await tx.pickupSlot.findUnique({
      where: { id: data.pickupSlotId },
    });

    if (!slot || !slot.isActive) {
      throw new Error("Selected pickup slot is no longer available");
    }

    if (slot.currentCount >= slot.maxOrders) {
      throw new Error("This pickup slot is full. Please choose another slot.");
    }

    // 4. Calculate totals server-side (NEVER trust client)
    let subtotal = 0;
    const orderItemsData = cart.items.map((item) => {
      const itemTotal =
        parseFloat(item.menuItem.price.toString()) * item.quantity;
      subtotal += itemTotal;
      return {
        menuItemId: item.menuItem.id,
        itemName: item.menuItem.name,
        itemPrice: item.menuItem.price,
        quantity: item.quantity,
        subtotal: itemTotal.toFixed(2),
        selectedOptions: item.selectedOptions as string[],
        specialNote: item.specialNote ?? null,
      };
    });

    // 5. Get service fee from settings
    const serviceFeeSettings = await tx.systemSetting.findUnique({
      where: { key: "serviceFee" },
    });
    const serviceFee = parseFloat(serviceFeeSettings?.value ?? "0");
    const totalAmount = subtotal + serviceFee;

    // 6. Handle wallet payment
    if (data.paymentMethod === "WALLET") {
      const wallet = await tx.wallet.findUnique({
        where: { userId: session.user.id },
      });

      if (!wallet) throw new Error("Wallet not found");

      const totalPaisa = Math.round(totalAmount * 100);
      if (wallet.balance < totalPaisa) {
        throw new Error(
          `Insufficient wallet balance. Required: Rs. ${totalAmount.toFixed(0)}, Available: Rs. ${(wallet.balance / 100).toFixed(0)}`
        );
      }

      // Debit wallet
      const newBalance = wallet.balance - totalPaisa;
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "PAYMENT",
          amount: -totalPaisa,
          balanceAfter: newBalance,
          description: `Order payment`,
        },
      });
    }

    // 7. Reserve pickup slot
    await tx.pickupSlot.update({
      where: { id: slot.id },
      data: { currentCount: { increment: 1 } },
    });

    // 8. Generate order number
    const orderCount = await tx.order.count();
    const orderNumber = `CB-${new Date().getFullYear()}-${(orderCount + 1001).toString()}`;
    const pickupCode = generatePickupCode();

    // 9. Create order
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        pickupSlotId: slot.id,
        status: "PENDING",
        pickupCode,
        specialNote: data.specialNote ?? null,
        items: {
          create: orderItemsData,
        },
        payment: {
          create: {
            method: data.paymentMethod,
            status: data.paymentMethod === "WALLET" ? "PAID" : "PENDING",
            amount: subtotal.toFixed(2),
            serviceFee: serviceFee.toFixed(2),
            total: totalAmount.toFixed(2),
            paidAt: data.paymentMethod === "WALLET" ? new Date() : null,
          },
        },
      },
    });

    // 10. Clear cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    // 11. Update totalOrdered counts
    for (const item of cart.items) {
      await tx.menuItem.update({
        where: { id: item.menuItemId },
        data: { totalOrdered: { increment: item.quantity } },
      });
    }

    // 12. Create confirmation notification
    await tx.notification.create({
      data: {
        userId: session.user.id,
        title: "Order Confirmed! 🎉",
        message: `Your order ${orderNumber} has been received. Pickup at ${slot.startTime}–${slot.endTime}.`,
        type: "success",
        orderId: order.id,
      },
    });

    return { orderId: order.id, orderNumber };
  });

  revalidatePath("/student/orders");
  revalidatePath("/staff/orders");
  return { success: true, data: result };
}

/** Get student orders */
export async function getStudentOrders(filter?: "active" | "past" | "cancelled") {
  const session = await auth();
  if (!session) return [];

  const statusFilters: Record<string, string[]> = {
    active: ["PENDING", "CONFIRMED", "PREPARING", "READY"],
    past: ["COMPLETED"],
    cancelled: ["CANCELLED"],
  };

  const allowedStatuses = filter ? statusFilters[filter] : undefined;

  // 1. Check in mockStore
  const mockMatches = mockStore.orders.filter(
    (o) =>
      o.userId === session.user.id &&
      (!allowedStatuses || allowedStatuses.includes(o.status))
  );
  if (mockMatches.length > 0) {
    return mockMatches.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  try {
    const statuses = filter ? (statusFilters[filter] as OrderStatus[]) : undefined;

    return await prisma.order.findMany({
      where: {
        userId: session.user.id,
        ...(statuses ? { status: { in: statuses } } : {}),
      },
      include: {
        items: { include: { menuItem: true } },
        payment: true,
        pickupSlot: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return mockMatches;
  }
}

/** Get single order (with authorization) */
export async function getOrder(orderId: string) {
  const session = await auth();
  if (!session) return null;

  const mockOrder = mockStore.orders.find((o) => o.id === orderId);
  if (mockOrder) {
    if (session.user.role === "STUDENT" && mockOrder.userId !== session.user.id) {
      return null;
    }
    return mockOrder;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: true } },
        payment: true,
        pickupSlot: true,
        user: { select: { name: true, email: true, studentProfile: true } },
      },
    });

    if (
      order &&
      session.user.role === "STUDENT" &&
      order.userId !== session.user.id
    ) {
      return null;
    }

    return order;
  } catch {
    return null;
  }
}

/** Cancel an order */
export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true, pickupSlot: true },
  });

  if (!order) return { success: false, error: "Order not found" };
  if (order.userId !== session.user.id && session.user.role === "STUDENT") {
    return { success: false, error: "Unauthorized" };
  }

  // Get cancellation cutoff from settings
  const cutoffSetting = await prisma.systemSetting.findUnique({
    where: { key: "cancellationCutoff" },
  });
  const cutoff = cutoffSetting?.value ?? "CONFIRMED";

  const cancellableStatuses: OrderStatus[] = ["PENDING", "CONFIRMED"];
  if (cutoff === "PREPARING") cancellableStatuses.push("PREPARING");

  if (!cancellableStatuses.includes(order.status)) {
    return {
      success: false,
      error: `Orders cannot be cancelled after ${order.status.toLowerCase()} stage`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    // Refund wallet payment
    if (order.payment?.method === "WALLET" && order.payment.status === "PAID") {
      const wallet = await tx.wallet.findUnique({
        where: { userId: order.userId },
      });
      if (wallet) {
        const refundPaisa = Math.round(
          parseFloat(order.payment.total.toString()) * 100
        );
        const newBalance = wallet.balance + refundPaisa;
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "REFUND",
            amount: refundPaisa,
            balanceAfter: newBalance,
            description: `Refund for cancelled order ${order.orderNumber}`,
            orderId,
          },
        });
        await tx.payment.update({
          where: { orderId },
          data: { status: "REFUNDED", refundedAt: new Date() },
        });
      }
    }

    // Free up pickup slot
    if (order.pickupSlotId) {
      await tx.pickupSlot.update({
        where: { id: order.pickupSlotId },
        data: { currentCount: { decrement: 1 } },
      });
    }

    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "Order Cancelled",
        message: `Your order ${order.orderNumber} has been cancelled.`,
        type: "info",
        orderId,
      },
    });
  });

  revalidatePath("/student/orders");
  return { success: true, data: undefined };
}

/** Staff: update order status */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<ActionResult> {
  const session = await auth();
  if (
    !session ||
    (session.user.role !== "STAFF" && session.user.role !== "ADMIN")
  ) {
    return { success: false, error: "Unauthorized" };
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, error: "Order not found" };

  const timestamps: Record<string, Date | null> = {};
  if (status === "CONFIRMED") timestamps.confirmedAt = new Date();
  if (status === "PREPARING") timestamps.preparingAt = new Date();
  if (status === "READY") timestamps.readyAt = new Date();
  if (status === "COMPLETED") timestamps.completedAt = new Date();

  await prisma.order.update({
    where: { id: orderId },
    data: { status, ...timestamps },
  });

  // Notify student on key transitions
  const notifyStatuses: Partial<Record<OrderStatus, { title: string; message: string; type: string }>> = {
    CONFIRMED: {
      title: "Order Confirmed ✅",
      message: `Your order ${order.orderNumber} has been confirmed by the cafeteria.`,
      type: "success",
    },
    PREPARING: {
      title: "Kitchen is Cooking! 👨‍🍳",
      message: `The kitchen has started preparing your order ${order.orderNumber}.`,
      type: "info",
    },
    READY: {
      title: "Your food is ready! 🎉",
      message: `Order ${order.orderNumber} is ready for pickup. Show your pickup code at the counter.`,
      type: "success",
    },
  };

  const notif = notifyStatuses[status];
  if (notif) {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        orderId,
      },
    });
  }

  revalidatePath("/staff/orders");
  revalidatePath("/student/orders");
  return { success: true, data: undefined };
}

/** Staff: verify pickup code and get order */
export async function verifyPickupCode(
  code: string
): Promise<ActionResult<{ orderId: string; orderNumber: string; studentName: string; items: { name: string; qty: number }[] }>> {
  const session = await auth();
  if (
    !session ||
    (session.user.role !== "STAFF" && session.user.role !== "ADMIN")
  ) {
    return { success: false, error: "Unauthorized" };
  }

  // 1. Mock store check
  const mockOrder = mockStore.orders.find(
    (o) => o.pickupCode === code && o.status === "READY"
  );
  if (mockOrder) {
    return {
      success: true,
      data: {
        orderId: mockOrder.id,
        orderNumber: mockOrder.orderNumber,
        studentName: mockOrder.user.name,
        items: mockOrder.items.map((i) => ({ name: i.itemName, qty: i.quantity })),
      },
    };
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        pickupCode: code,
        status: "READY",
      },
      include: {
        user: { select: { name: true } },
        items: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: "No ready order found with this pickup code",
      };
    }

    return {
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        studentName: order.user.name,
        items: order.items.map((i) => ({ name: i.itemName, qty: i.quantity })),
      },
    };
  } catch {
    return {
      success: false,
      error: "No ready order found with this pickup code",
    };
  }
}

/** Staff: get all orders for board view */
export async function getStaffOrders() {
  const session = await auth();
  if (
    !session ||
    (session.user.role !== "STAFF" && session.user.role !== "ADMIN")
  ) {
    return [];
  }

  const mockActive = mockStore.orders.filter((o) =>
    ["PENDING", "CONFIRMED", "PREPARING", "READY"].includes(o.status)
  );
  if (mockActive.length > 0) {
    return mockActive.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  try {
    return await prisma.order.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] },
      },
      include: {
        items: true,
        pickupSlot: true,
        user: { select: { name: true, studentProfile: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  } catch {
    return mockActive;
  }
}
