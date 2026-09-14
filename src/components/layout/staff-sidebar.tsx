"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, UtensilsCrossed, QrCode, Utensils, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/staff/orders", label: "Orders", icon: ClipboardList },
  { href: "/staff/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/staff/pickup", label: "Pickup Verify", icon: QrCode },
];

interface StaffSidebarProps {
  user: { name: string; role: string };
}

export function StaffSidebar({ user }: StaffSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="p-4 border-b border-gray-200 mb-2">
        <div className="flex items-center gap-2 font-bold text-lg text-gray-900">
          <span className="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-lg text-white">
            <Utensils size={15} />
          </span>
          Campus<span className="text-orange-500">Bite</span>
        </div>
        <div className="text-xs text-gray-500 mt-1 ml-10">
          Staff Portal
        </div>
      </div>

      <nav className="px-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">{user.name}</div><button onClick={() => signOut({ callbackUrl: "/login" })} className="mt-2 text-xs font-semibold text-gray-600 hover:text-orange-600">Sign out</button>
        <div className="text-xs text-orange-600 font-medium capitalize">
          {user.role.toLowerCase()}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 flex-col z-30">
        {navContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2 font-bold text-gray-900">
          <span className="flex items-center justify-center w-7 h-7 bg-orange-500 rounded-lg text-white">
            <Utensils size={13} />
          </span>
          Staff Portal
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-64 bg-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}

      {/* Mobile spacer */}
      <div className="md:hidden h-14" />
    </>
  );
}
