"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { actionError, OrderError } from "@/lib/order-helpers";
import type { ActionResult } from "./auth";
export async function getWallet() {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") return null;
  return prisma.wallet.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id, balance: 0 },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
}
export async function adminAddWalletCredit(
  userId: string,
  amountRupees: number,
  description = "Admin top-up",
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };
  if (
    !Number.isFinite(amountRupees) ||
    amountRupees <= 0 ||
    amountRupees > 50000 ||
    Math.abs(amountRupees * 100 - Math.round(amountRupees * 100)) > 0.000001
  )
    return {
      success: false,
      error:
        "Enter a valid amount up to Rs. 50,000 with at most two decimal places.",
    };
  if (typeof description !== "string" || description.length > 300)
    return {
      success: false,
      error: "Description must be under 300 characters",
    };
  const amount = Math.round(amountRupees * 100);
  try {
    await prisma.$transaction(async (tx) => {
      if (
        !(await tx.user.findFirst({
          where: { id: userId, role: "STUDENT", isActive: true },
        }))
      )
        throw new OrderError("Active student not found");
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: { balance: { increment: amount } },
        create: { userId, balance: amount },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "TOP_UP",
          amount,
          balanceAfter: wallet.balance,
          description,
        },
      });
      await tx.notification.create({
        data: {
          userId,
          title: "Wallet topped up",
          message: `Rs. ${amountRupees} has been added to your campus wallet.`,
          type: "success",
        },
      });
    });
    revalidatePath("/admin/users");
    revalidatePath("/student", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}
