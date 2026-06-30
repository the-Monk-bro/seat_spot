import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto bg-[#0D3B36]">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-lg mb-5 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-white/15 border border-white/20 text-white shadow-sm group-hover:bg-white/25 transition-colors">
                <UtensilsCrossed className="h-3.5 w-3.5" />
              </span>
              <span className="font-playfair tracking-tight text-white">
                Seat<span className="text-[#D4AF37]">Spot</span>
              </span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Discover great restaurants, browse menus, and reserve your table in seconds.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-5 text-xs tracking-[0.12em] uppercase text-white/35">Explore</h3>
            <ul className="space-y-3 text-sm text-white/55">
              <li><Link href="/restaurants" className="hover:text-white transition-colors duration-150">Find Restaurants</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors duration-150">Create Account</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors duration-150">Sign In</Link></li>
            </ul>
          </div>

          {/* For owners */}
          <div>
            <h3 className="font-semibold mb-5 text-xs tracking-[0.12em] uppercase text-white/35">For Restaurants</h3>
            <ul className="space-y-3 text-sm text-white/55">
              <li><Link href="/register" className="hover:text-white transition-colors duration-150">List Your Restaurant</Link></li>
              <li><Link href="/owner/dashboard" className="hover:text-white transition-colors duration-150">Owner Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-center text-xs text-white/30">
          © {new Date().getFullYear()} SeatSpot. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
