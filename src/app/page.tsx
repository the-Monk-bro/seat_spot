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
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 md:py-32">
          <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                <UtensilsCrossed className="h-3.5 w-3.5" />
                India&apos;s #1 Table Reservation Platform
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight mb-6">
                Reserve Your Perfect{" "}
                <span className="text-primary relative">
                  Dining Experience
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M1 9C50 3 100 1 150 3C200 5 250 8 299 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/40"/>
                  </svg>
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
                Discover top restaurants, browse their menus, and book your table in seconds. No waiting, no calling.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild className="shadow-lg shadow-primary/25 h-12 px-8 text-base">
                  <Link href="/restaurants"><Search className="h-4 w-4 mr-2" />Find a Restaurant</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                  <Link href="/register">List Your Restaurant<ArrowRight className="h-4 w-4 ml-2" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">How It Works</h2>
              <p className="text-muted-foreground">Reserve your table in 3 simple steps</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { icon: Search, step: "01", title: "Discover", desc: "Browse our curated list of restaurants, filter by cuisine, city, or availability." },
                { icon: UtensilsCrossed, step: "02", title: "Explore Menus", desc: "Browse the full menu before you go — no surprises when you arrive." },
                { icon: Calendar, step: "03", title: "Reserve", desc: "Pick your date, time, and party size. Your table is confirmed instantly." },
              ].map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="text-center group">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-primary/60 mb-1">{step}</div>
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Restaurants */}
        {restaurants.length > 0 && (
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Featured Restaurants</h2>
                  <p className="text-muted-foreground">Handpicked dining experiences</p>
                </div>
                <Button variant="ghost" asChild>
                  <Link href="/restaurants" className="flex items-center gap-1">View all <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((r) => <RestaurantCard key={r._id} restaurant={r} />)}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-primary to-orange-600">
          <div className="container mx-auto px-4 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Own a Restaurant?</h2>
            <p className="text-white/80 mb-8 text-lg max-w-xl mx-auto">Join thousands of restaurants on SeatSpot. Manage tables, menus, and reservations all in one place.</p>
            <Button size="lg" variant="secondary" asChild className="h-12 px-8 text-base font-semibold">
              <Link href="/register">List Your Restaurant Free<ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}
