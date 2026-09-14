"use server";

import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { auth } from "@/lib/auth";
import type { ActionResult } from "./auth";

/** Get wallet for current student */
export async function getWallet() {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") return null;

  const mockWallet = mockStore.wallets.get(session.user.id);
  if (mockWallet) return mockWallet;

  try {
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: session.user.id, balance: 0 },
        include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
      });
    }

    return wallet;
  } catch {
    return (
      mockWallet ?? {
        id: `w_${session.user.id}`,
        userId: session.user.id,
        balance: 150000,
        createdAt: new Date(),
        updatedAt: new Date(),
        transactions: [],
      }
    );
  }
}

/** Admin: add wallet credit to a student (demo top-up) */
export async function adminAddWalletCredit(
  userId: string,
  amountRupees: number,
  description: string = "Admin top-up"
): Promise<ActionResult> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  if (amountRupees <= 0 || amountRupees > 50000) {
    return { success: false, error: "Invalid amount" };
  }

  const amountPaisa = Math.round(amountRupees * 100);

  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId, balance: 0 },
    });
  }

  const newBalance = wallet.balance + amountPaisa;

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet!.id },
      data: { balance: newBalance },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet!.id,
        type: "TOP_UP",
        amount: amountPaisa,
        balanceAfter: newBalance,
        description,
      },
    });

    await tx.notification.create({
      data: {
        userId,
        title: "Wallet Topped Up 💰",
        message: `Rs. ${amountRupees} has been added to your campus wallet.`,
        type: "success",
      },
    });
  });

  return { success: true, data: undefined };
}
