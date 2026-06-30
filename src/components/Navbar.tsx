"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, UtensilsCrossed, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardHref =
    session?.user.role === "ADMIN"
      ? "/admin/dashboard"
      : session?.user.role === "OWNER"
        ? "/owner/dashboard"
        : "/customer/dashboard";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-[0_1px_12px_0_rgba(15,118,110,0.06)]">
      <div className="container mx-auto flex h-[68px] items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group">
          <span className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-primary text-primary-foreground shadow-sm group-hover:shadow-md transition-shadow">
            <UtensilsCrossed className="h-4 w-4" />
          </span>
          <span className="text-foreground font-playfair tracking-tight">
            Seat<span className="text-primary">Spot</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/restaurants"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-[-2px] after:left-0 after:h-[1.5px] after:w-0 after:bg-primary after:transition-all after:duration-200 hover:after:w-full"
          >
            Restaurants
          </Link>

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-full h-9 px-4 border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <User className="h-3.5 w-3.5" />
                  {session.user.name?.split(" ")[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border/60">
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref} className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="text-sm font-medium hover:text-primary hover:bg-primary/5">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="rounded-full h-9 px-5 shadow-sm hover:shadow-md transition-shadow">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-white px-6 py-5 space-y-4">
          <Link
            href="/restaurants"
            className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Restaurants
          </Link>
          {session ? (
            <>
              <Link
                href={dashboardHref}
                className="block text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                className="block text-sm font-medium text-destructive"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
              <Link href="/register" className="block text-sm font-medium text-primary" onClick={() => setMobileOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
