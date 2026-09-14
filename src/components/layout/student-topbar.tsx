"use client";

import Link from "next/link";
import { Bell, ShoppingCart, Utensils } from "lucide-react";
import { usePathname } from "next/navigation";

interface StudentTopBarProps {
  user: { name: string; email: string };
}

export function StudentTopBar({ user }: StudentTopBarProps) {
  const pathname = usePathname();

  // Map paths to page titles
  const pageTitles: Record<string, string> = {
    "/student": "Home",
    "/student/menu": "Menu",
    "/student/cart": "My Cart",
    "/student/checkout": "Checkout",
    "/student/orders": "My Orders",
    "/student/wallet": "Wallet",
    "/student/notifications": "Notifications",
    "/student/profile": "Profile",
  };

  const title = pageTitles[pathname] ?? "CampusBite";
  const isHome = pathname === "/student";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {isHome ? (
          <div className="flex items-center gap-2 font-bold text-lg text-gray-900">
            <span className="flex items-center justify-center w-7 h-7 bg-orange-500 rounded-lg text-white">
              <Utensils size={14} />
            </span>
            Campus<span className="text-orange-500">Bite</span>
          </div>
        ) : (
          <h1 className="font-semibold text-gray-900">{title}</h1>
        )}

        <div className="flex items-center gap-1"><Link href="/student/profile" className="mr-2 hidden text-sm font-medium text-gray-600 sm:block">{user.name.split(" ")[0]}</Link>
          <Link
            href="/student/notifications"
            className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </Link>
          <Link
            href="/student/cart"
            className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
