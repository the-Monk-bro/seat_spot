"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { LucideIcon, LogOut, UtensilsCrossed, LayoutDashboard, Store, Calendar, Users } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  restaurants: Store,
  reservations: Calendar,
  users: Users,
};

interface NavItem {
  href: string;
  label: string;
  icon: "dashboard" | "restaurants" | "reservations" | "users";
}

interface SidebarProps {
  navItems: NavItem[];
  role: string;
}

export function Sidebar({ navItems, role }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r bg-white min-h-screen flex flex-col">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 px-6 h-16 border-b font-bold text-lg hover:opacity-90 transition-opacity"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <UtensilsCrossed className="h-3.5 w-3.5" />
        </span>
        <span className="text-foreground">Seat<span className="text-primary">Spot</span></span>
      </Link>

      {/* Role badge */}
      <div className="px-4 py-3 border-b">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary capitalize">
          {role.toLowerCase()} portal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon }) => {
          const Icon = ICON_MAP[icon];
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
