import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-grey mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UtensilsCrossed className="h-3.5 w-3.5" />
              </span>
              <span className="text-foreground">Seat<span className="text-primary">Spot</span></span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover great restaurants, browse menus, and reserve your table in seconds.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Explore</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/restaurants" className="hover:text-foreground transition-colors">Find Restaurants</Link></li>
              <li><Link href="/register" className="hover:text-foreground transition-colors">Create Account</Link></li>
              <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* For owners */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">For Restaurants</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/register" className="hover:text-foreground transition-colors">List Your Restaurant</Link></li>
              <li><Link href="/owner/dashboard" className="hover:text-foreground transition-colors">Owner Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SeatSpot. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
