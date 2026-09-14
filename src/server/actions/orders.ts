"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import {
  actionError,
  campusClock,
  OrderError,
  toMinutes,
  unitPrice,
} from "@/lib/order-helpers";
import { ensurePickupSlots } from "@/lib/pickup-slots";
import { revalidatePath } from "next/cache";
import { randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import type { OrderStatus } from "@prisma/client";
import type { ActionResult } from "./auth";
const active: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY"];
const orderInclude = {
  items: { include: { menuItem: true } },
  payment: true,
  pickupSlot: true,
};
function refreshOrders() {
  for (const path of ["/student", "/staff", "/admin"])
    revalidatePath(path, "layout");
}
export async function getAvailablePickupSlots() {
  return ensurePickupSlots();
}
const checkoutSchema = z.object({
  pickupSlotId: z.string().min(1),
  paymentMethod: z.enum(["CASH", "WALLET"]),
  specialNote: z.string().trim().max(300).optional(),
});
export async function createOrder(
  data: z.infer<typeof checkoutSchema>,
): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT")
    return { success: false, error: "Unauthorized" };
  const parsed = checkoutSchema.safeParse(data);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const cart = await tx.cart.findUnique({
          where: { userId: session.user.id },
          include: {
            items: {
              include: {
                menuItem: { include: { options: true, category: true } },
              },
            },
          },
        });
        if (!cart?.items.length) throw new OrderError("Your cart is empty");
        const rows = await tx.systemSetting.findMany();
        const settings = Object.fromEntries(
          rows.map((row) => [row.key, row.value]),
        );
        const clock = campusClock();
        const open = toMinutes(settings.openTime ?? "08:00");
        const close = toMinutes(settings.closeTime ?? "18:00");
        if (clock.minutes < open || clock.minutes >= close)
          throw new OrderError(
            "The cafeteria is currently closed. Please order during opening hours.",
          );
        if (
          settings[
            parsed.data.paymentMethod === "CASH"
              ? "cashEnabled"
              : "walletEnabled"
          ] === "false"
        )
          throw new OrderError("This payment method is currently disabled");
        const slot = await tx.pickupSlot.findUnique({
          where: { id: parsed.data.pickupSlotId },
        });
        const prep = Math.max(
          Number(settings.avgPrepTime ?? 12),
          ...cart.items.map((item) => item.menuItem.preparationTime),
        );
        if (
          !slot ||
          !slot.isActive ||
          slot.date.getTime() !== clock.date.getTime() ||
          toMinutes(slot.startTime) < clock.minutes + prep ||
          toMinutes(slot.startTime) < open ||
          toMinutes(slot.endTime) > close
        )
          throw new OrderError(
            "Choose a future pickup slot with enough preparation time.",
          );
        const reserved = await tx.pickupSlot.updateMany({
          where: {
            id: slot.id,
            currentCount: { lt: slot.maxOrders },
            isActive: true,
          },
          data: { currentCount: { increment: 1 } },
        });
        if (reserved.count !== 1)
          throw new OrderError(
            "This pickup slot is full. Please choose another.",
          );
        let subtotalPaisa = 0;
        const items = cart.items.map((item) => {
          if (
            !item.menuItem.isActive ||
            !item.menuItem.isAvailable ||
            !item.menuItem.category.isActive
          )
            throw new OrderError(
              `${item.menuItem.name} is no longer available`,
            );
          if (
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > 20
          )
            throw new OrderError("Invalid cart quantity");
          const price = unitPrice(item.menuItem, item.selectedOptions);
          subtotalPaisa += price * item.quantity;
          return {
            menuItemId: item.menuItemId,
            itemName: item.menuItem.name,
            itemPrice: (price / 100).toFixed(2),
            quantity: item.quantity,
            subtotal: ((price * item.quantity) / 100).toFixed(2),
            selectedOptions: item.selectedOptions as string[],
            specialNote: item.specialNote,
          };
        });
        const feePaisa = Math.round(Number(settings.serviceFee ?? 0) * 100);
        if (!Number.isSafeInteger(feePaisa) || feePaisa < 0 || feePaisa > 10000)
          throw new OrderError(
            "The service fee is invalid. Please contact the cafeteria.",
          );
        const totalPaisa = subtotalPaisa + feePaisa;
        const orderNumber = `CB-${new Date().getFullYear()}-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
        let pickupCode = "";
        for (let attempt = 0; attempt < 30; attempt++) {
          const candidate = randomInt(1000, 10000).toString();
          if (
            !(await tx.order.findFirst({
              where: { pickupCode: candidate, status: { in: active } },
            }))
          ) {
            pickupCode = candidate;
            break;
          }
        }
        if (!pickupCode)
          throw new OrderError(
            "Unable to reserve a pickup code. Please try again.",
          );
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId: session.user.id,
            pickupSlotId: slot.id,
            pickupCode,
            specialNote: parsed.data.specialNote,
            items: { create: items },
            payment: {
              create: {
                method: parsed.data.paymentMethod,
                status:
                  parsed.data.paymentMethod === "WALLET" ? "PAID" : "PENDING",
                amount: (subtotalPaisa / 100).toFixed(2),
                serviceFee: (feePaisa / 100).toFixed(2),
                total: (totalPaisa / 100).toFixed(2),
                paidAt:
                  parsed.data.paymentMethod === "WALLET" ? new Date() : null,
              },
            },
          },
        });
        if (parsed.data.paymentMethod === "WALLET") {
          const debit = await tx.wallet.updateMany({
            where: { userId: session.user.id, balance: { gte: totalPaisa } },
            data: { balance: { decrement: totalPaisa } },
          });
          if (debit.count !== 1)
            throw new OrderError(
              "Insufficient wallet balance. Top up or choose cash at pickup.",
            );
          const wallet = await tx.wallet.findUniqueOrThrow({
            where: { userId: session.user.id },
          });
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "PAYMENT",
              amount: -totalPaisa,
              balanceAfter: wallet.balance,
              description: `Payment for ${orderNumber}`,
              orderId: order.id,
            },
          });
        }
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        for (const item of cart.items)
          await tx.menuItem.update({
            where: { id: item.menuItemId },
            data: { totalOrdered: { increment: item.quantity } },
          });
        await tx.notification.create({
          data: {
            userId: session.user.id,
            title: "Order received",
            message: `${orderNumber} has been received. Pickup ${slot.startTime}–${slot.endTime}.`,
            type: "success",
            orderId: order.id,
          },
        });
        return { orderId: order.id, orderNumber };
      },
      { isolationLevel: "Serializable", maxWait: 10000, timeout: 20000 },
    );
    refreshOrders();
    return { success: true, data: result };
  } catch (error) {
    return actionError(error);
  }
}
export async function getStudentOrders(
  filter?: "active" | "past" | "cancelled",
) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") return [];
  const statuses: OrderStatus[] | undefined =
    filter === "active"
      ? active
      : filter === "past"
        ? ["COMPLETED"]
        : filter === "cancelled"
          ? ["CANCELLED"]
          : undefined;
  return serialize(
    await prisma.order.findMany({
      where: {
        userId: session.user.id,
        ...(statuses ? { status: { in: statuses } } : {}),
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    }),
  );
}
export async function getOrder(orderId: string) {
  const session = await auth();
  if (!session) return null;
  return serialize(
    await prisma.order.findFirst({
      where: {
        id: orderId,
        ...(session.user.role === "STUDENT" ? { userId: session.user.id } : {}),
      },
      include: {
        ...orderInclude,
        user: { select: { name: true, email: true, studentProfile: true } },
      },
    }),
  );
}
export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };
  try {
    await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findFirst({
          where: {
            id: orderId,
            ...(session.user.role === "STUDENT"
              ? { userId: session.user.id }
              : {}),
          },
          include: { payment: true },
        });
        if (!order) throw new OrderError("Order not found");
        const cutoff = await tx.systemSetting.findUnique({
          where: { key: "cancellationCutoff" },
        });
        const cancellable: OrderStatus[] =
          cutoff?.value === "PENDING"
            ? ["PENDING"]
            : cutoff?.value === "PREPARING"
              ? ["PENDING", "CONFIRMED", "PREPARING"]
              : ["PENDING", "CONFIRMED"];
        if (!cancellable.includes(order.status))
          throw new OrderError("This order can no longer be cancelled.");
        const changed = await tx.order.updateMany({
          where: { id: orderId, status: order.status },
          data: { status: "CANCELLED", cancelledAt: new Date() },
        });
        if (!changed.count)
          throw new OrderError("Order changed. Please refresh and try again.");
        if (
          order.payment?.method === "WALLET" &&
          order.payment.status === "PAID"
        ) {
          const amount = Math.round(Number(order.payment.total) * 100);
          const wallet = await tx.wallet.update({
            where: { userId: order.userId },
            data: { balance: { increment: amount } },
          });
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "REFUND",
              amount,
              balanceAfter: wallet.balance,
              description: `Refund for ${order.orderNumber}`,
              orderId,
            },
          });
          await tx.payment.update({
            where: { orderId },
            data: { status: "REFUNDED", refundedAt: new Date() },
          });
        } else if (order.payment)
          await tx.payment.update({
            where: { orderId },
            data: { status: "FAILED" },
          });
        if (order.pickupSlotId)
          await tx.pickupSlot.updateMany({
            where: { id: order.pickupSlotId, currentCount: { gt: 0 } },
            data: { currentCount: { decrement: 1 } },
          });
        await tx.notification.create({
          data: {
            userId: order.userId,
            title: "Order cancelled",
            message: `${order.orderNumber} has been cancelled. Wallet payments have been refunded.`,
            type: "info",
            orderId,
          },
        });
      },
      { isolationLevel: "Serializable", timeout: 15000 },
    );
    refreshOrders();
    return { success: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResult> {
  const session = await auth();
  if (!session || !["STAFF", "ADMIN"].includes(session.user.role))
    return { success: false, error: "Unauthorized" };
  if (status === "CANCELLED") return cancelOrder(orderId);
  const transitions: Partial<Record<OrderStatus, OrderStatus>> = {
    CONFIRMED: "PENDING",
    PREPARING: "CONFIRMED",
    READY: "PREPARING",
    COMPLETED: "READY",
  };
  const previous = transitions[status];
  if (!previous) return { success: false, error: "Invalid order transition" };
  try {
    await prisma.$transaction(async (tx) => {
      const timestamps = {
        confirmedAt: status === "CONFIRMED" ? new Date() : undefined,
        preparingAt: status === "PREPARING" ? new Date() : undefined,
        readyAt: status === "READY" ? new Date() : undefined,
        completedAt: status === "COMPLETED" ? new Date() : undefined,
      };
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: previous },
        data: { status, ...timestamps },
      });
      if (!updated.count)
        throw new OrderError(
          "Order changed or this transition is not allowed. Please refresh.",
        );
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
      });
      if (status === "COMPLETED")
        await tx.payment.updateMany({
          where: { orderId, method: "CASH", status: "PENDING" },
          data: { status: "PAID", paidAt: new Date() },
        });
      await tx.notification.create({
        data: {
          userId: order.userId,
          title:
            status === "READY"
              ? "Your food is ready!"
              : `Order ${status.toLowerCase()}`,
          message: `${order.orderNumber} is ${status.toLowerCase()}.`,
          type: "success",
          orderId,
        },
      });
    });
    refreshOrders();
    return { success: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}
export async function verifyPickupCode(
  code: string,
): Promise<
  ActionResult<{
    orderId: string;
    orderNumber: string;
    studentName: string;
    items: { name: string; qty: number }[];
  }>
> {
  const session = await auth();
  if (!session || !["STAFF", "ADMIN"].includes(session.user.role))
    return { success: false, error: "Unauthorized" };
  if (!/^\d{4}$/.test(code))
    return { success: false, error: "Enter a 4-digit pickup code" };
  try {
    const orders = await prisma.order.findMany({
      where: { pickupCode: code, status: "READY" },
      include: { user: { select: { name: true } }, items: true },
      take: 2,
    });
    if (orders.length !== 1)
      throw new OrderError(
        orders.length
          ? "More than one order has this code. Verify the order number on the kitchen board."
          : "No ready order found with this pickup code",
      );
    const order = orders[0];
    return {
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        studentName: order.user.name,
        items: order.items.map((item) => ({
          name: item.itemName,
          qty: item.quantity,
        })),
      },
    };
  } catch (error) {
    return actionError(error);
  }
}
export async function getStaffOrders() {
  const session = await auth();
  if (!session || !["STAFF", "ADMIN"].includes(session.user.role)) return [];
  return serialize(
    await prisma.order.findMany({
      where: { status: { in: active } },
      include: {
        items: true,
        pickupSlot: true,
        user: { select: { name: true, studentProfile: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  );
}
