"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, ShoppingBag, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/student", label: "Home", icon: Home, exact: true },
  { href: "/student/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/student/orders", label: "Orders", icon: ShoppingBag },
  { href: "/student/wallet", label: "Wallet", icon: Wallet },
  { href: "/student/profile", label: "Profile", icon: User },
];

export function StudentBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 safe-bottom"
      aria-label="Student navigation"
    >
      <div className="max-w-2xl mx-auto flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-3 text-xs font-medium transition-colors",
                isActive
                  ? "text-orange-600"
                  : "text-gray-400 hover:text-gray-600"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={22}
                className={cn(
                  "transition-transform",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
