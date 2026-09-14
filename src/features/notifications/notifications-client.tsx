"use client";

import Link from "next/link";
import { Bell, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";
import type { Notification } from "@prisma/client";
import { cn } from "@/lib/utils";

const ICONS = {
  success: <CheckCircle size={16} className="text-green-600" />,
  info: <Info size={16} className="text-blue-600" />,
  warning: <AlertTriangle size={16} className="text-amber-600" />,
  error: <XCircle size={16} className="text-red-600" />,
};

const BG = {
  success: "bg-green-50",
  info: "bg-blue-50",
  warning: "bg-amber-50",
  error: "bg-red-50",
};

export function NotificationsClient({
  notifications,
}: {
  notifications: Notification[];
}) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        icon="🔔"
        title="You're all caught up"
        description="No new notifications."
        className="py-24"
      />
    );
  }

  return (
    <div className="py-4 space-y-2">
      {notifications.map((n) => {
        const type = n.type as keyof typeof ICONS;
        const Wrapper = n.orderId
          ? (props: React.ComponentProps<"a">) => (
              <Link href={`/student/orders/${n.orderId}`} {...props} />
            )
          : "div";

        return (
          <Wrapper
            key={n.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-2xl border border-gray-100",
              n.orderId ? "hover:shadow-sm transition-shadow cursor-pointer" : "",
              "bg-white"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                BG[type] ?? "bg-gray-50"
              )}
            >
              {ICONS[type] ?? <Bell size={16} className="text-gray-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 mb-0.5">
                {n.title}
              </div>
              <div className="text-sm text-gray-600">{n.message}</div>
              <div className="text-xs text-gray-400 mt-1">
                {timeAgo(n.createdAt)}
              </div>
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}
