"use client";

import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { paisaToRupees, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { Wallet, WalletTransaction } from "@/types/models";

type FullWallet = Wallet & { transactions: WalletTransaction[] };

const TX_ICONS = {
  TOP_UP: <ArrowDownLeft size={16} className="text-green-600" />,
  PAYMENT: <ArrowUpRight size={16} className="text-red-600" />,
  REFUND: <RefreshCw size={16} className="text-blue-600" />,
};

const TX_COLORS = {
  TOP_UP: "text-green-600",
  PAYMENT: "text-red-600",
  REFUND: "text-blue-600",
};

export function WalletClient({ wallet }: { wallet: FullWallet | null }) {
  const balance = wallet?.balance ?? 0;
  const transactions = wallet?.transactions ?? [];

  return (
    <div className="py-4 space-y-5">
      {/* Balance card */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <div className="text-sm text-gray-400 mb-1">Campus Wallet Balance</div>
        <div className="text-4xl font-bold mb-4">
          {paisaToRupees(balance)}
        </div>
        <div className="text-xs text-gray-500">
          Contact admin to top up your wallet balance.
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">
          Transaction History
        </h2>

        {transactions.length === 0 ? (
          <EmptyState
            icon="💳"
            title="No transactions yet"
            description="Your wallet activity will appear here."
          />
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    tx.type === "TOP_UP"
                      ? "bg-green-50"
                      : tx.type === "REFUND"
                      ? "bg-blue-50"
                      : "bg-red-50"
                  }`}
                >
                  {TX_ICONS[tx.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {tx.description}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(tx.createdAt)}
                  </div>
                </div>
                <div className={`font-bold text-sm ${TX_COLORS[tx.type]}`}>
                  {tx.type === "PAYMENT" ? "-" : "+"}
                  {paisaToRupees(Math.abs(tx.amount))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
