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
    <aside className="w-64 shrink-0 border-r border-border/60 bg-[#FAFAF8] min-h-screen flex flex-col">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 px-6 h-[68px] border-b border-border/60 font-bold text-lg hover:opacity-90 transition-opacity"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-primary text-primary-foreground shadow-sm">
          <UtensilsCrossed className="h-3.5 w-3.5" />
        </span>
        <span className="text-foreground font-playfair tracking-tight">
          Seat<span className="text-primary">Spot</span>
        </span>
      </Link>

      {/* Role badge */}
      <div className="px-5 py-4 border-b border-border/60">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary capitalize tracking-wide">
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-primary/8 hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-border/60">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-destructive transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
