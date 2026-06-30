import Link from "next/link";
import { Search, Calendar, ArrowRight, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { connectDB } from "@/lib/mongoose";
import Restaurant from "@/models/Restaurant";
import type { IRestaurant } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SeatSpot — Restaurant Reservations Made Simple",
  description: "Discover top restaurants, browse menus, and book your table instantly.",
};

async function getFeaturedRestaurants(): Promise<IRestaurant[]> {
  await connectDB();
  const restaurants = await Restaurant.find({ status: "APPROVED" })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();
  return JSON.parse(JSON.stringify(restaurants));
}

export default async function HomePage() {
  const restaurants = await getFeaturedRestaurants();

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8]">
      <Navbar />
      <main className="flex-1">

        {/* ── Hero Section ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#FAFAF8] py-28 md:py-40">
          {/* Subtle background decoration */}
          <div className="pointer-events-none absolute -top-48 right-0 h-[600px] w-[600px] rounded-full bg-primary/6 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-0 -left-24 h-[400px] w-[400px] rounded-full bg-accent/40 blur-[100px]" />

          <div className="container mx-auto px-6 relative">
            <div className="max-w-3xl mx-auto text-center">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-sm font-medium text-primary mb-8">
                <UtensilsCrossed className="h-3.5 w-3.5" />
                India&apos;s Premier Dining Reservation Platform
              </div>

              <h1 className="font-playfair text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
                Reserve Your Perfect{" "}
                <span className="text-primary italic">Dining Experience</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto leading-relaxed">
                Discover top restaurants, browse their menus, and book your table in seconds. No waiting, no calling.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  asChild
                  className="rounded-full h-13 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Link href="/restaurants">
                    <Search className="h-4 w-4 mr-2" />Find a Restaurant
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="rounded-full h-13 px-8 text-base border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                >
                  <Link href="/register">List Your Restaurant<ArrowRight className="h-4 w-4 ml-2" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div className="container mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* ── How It Works ────────────────────────────────────────────── */}
        <section
          className="relative py-28 overflow-hidden"
          style={{ backgroundImage: "url('/how-it-works-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center 55%" }}
        >
          {/* Very subtle overlay — image shows through, frosted boxes handle legibility */}
          <div className="absolute inset-0 bg-black/10" />

          <div className="relative container mx-auto px-6">
            {/* Frosted heading pill */}
            <div className="text-center mb-14">
              <div className="inline-block rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-sm px-10 py-8 mb-2">
                <h2 className="font-playfair text-4xl font-bold text-foreground">How It Works</h2>
                <p className="text-primary/90 mt-3 max-w-md mx-auto font-semibold">Reserve your table in 3 simple steps</p>
              </div>
            </div>

            {/* Step cards — each with its own frosted glass box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Search, step: "01", title: "Discover", desc: "Browse our curated list of restaurants, filter by cuisine, city, or availability." },
                { icon: UtensilsCrossed, step: "02", title: "Explore Menus", desc: "Browse the full menu before you go — no surprises when you arrive." },
                { icon: Calendar, step: "03", title: "Reserve", desc: "Pick your date, time, and party size. Your table is confirmed instantly." },
              ].map(({ icon: Icon, step, title, desc }) => (
                <div
                  key={step}
                  className="group rounded-2xl bg-white/55 backdrop-blur-md border border-white/70 shadow-sm hover:shadow-md hover:bg-white/70 transition-all duration-300 px-7 py-8 text-center"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/80 border border-primary/20 shadow-sm group-hover:border-primary/40 group-hover:bg-white transition-all duration-200 mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-playfair font-bold text-primary/90 mb-1.5 leading-none">{step}</div>
                  <h3 className="font-semibold text-base mb-2 text-foreground">{title}</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── Featured Restaurants ────────────────────────────────────── */}
        {restaurants.length > 0 && (
          <section className="py-24 bg-white">
            <div className="container mx-auto px-6">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary/70 mb-2">Handpicked for you</p>
                  <h2 className="font-playfair text-4xl font-bold text-foreground">Featured Restaurants</h2>
                </div>
                <Button variant="ghost" asChild className="text-primary hover:text-primary hover:bg-primary/5 rounded-full">
                  <Link href="/restaurants" className="flex items-center gap-1.5 text-sm font-medium">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {restaurants.map((r) => <RestaurantCard key={r._id} restaurant={r} />)}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section className="py-24 bg-[#FAFAF8]">
          <div className="container mx-auto px-6">
            <div className="rounded-3xl bg-gradient-to-br from-primary to-teal-800 px-10 py-16 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/20">
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/8 blur-2xl" />
              <div className="relative">
                <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-4">Own a Restaurant?</h2>
                <p className="text-white/75 mb-10 text-lg max-w-xl mx-auto leading-relaxed">
                  Join thousands of restaurants on SeatSpot. Manage tables, menus, and reservations all in one place.
                </p>
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="rounded-full h-13 px-8 text-base font-semibold bg-white text-primary hover:bg-white/90 shadow-lg"
                >
                  <Link href="/register">List Your Restaurant Free<ArrowRight className="h-4 w-4 ml-2" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}
