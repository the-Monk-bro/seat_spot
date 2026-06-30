import { Suspense } from "react";
import { Search } from "lucide-react";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Skeleton } from "@/components/ui/skeleton";
import { connectDB } from "@/lib/mongoose";
import Restaurant from "@/models/Restaurant";
import type { IRestaurant } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Restaurants",
  description: "Browse and discover approved restaurants near you. Filter by cuisine, city, and more.",
};

interface SearchParams {
  city?: string;
  cuisine?: string;
  q?: string;
}

async function getRestaurants(filters: SearchParams): Promise<IRestaurant[]> {
  await connectDB();

  const query: Record<string, unknown> = { status: "APPROVED" };

  if (filters.city) {
    query.city = { $regex: filters.city, $options: "i" };
  }
  if (filters.cuisine) {
    query.cuisine = { $regex: filters.cuisine, $options: "i" };
  }
  if (filters.q) {
    query.$or = [
      { name: { $regex: filters.q, $options: "i" } },
      { description: { $regex: filters.q, $options: "i" } },
    ];
  }

  const restaurants = await Restaurant.find(query).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(restaurants));
}

async function getCities(): Promise<string[]> {
  await connectDB();
  const cities = await Restaurant.distinct("city", { status: "APPROVED" });
  return cities.sort();
}

async function getCuisines(): Promise<string[]> {
  await connectDB();
  const cuisines = await Restaurant.distinct("cuisine", { status: "APPROVED" });
  return cuisines.sort();
}

function RestaurantGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-border/60 bg-white">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [restaurants, cities, cuisines] = await Promise.all([
    getRestaurants(params),
    getCities(),
    getCuisines(),
  ]);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Page header */}
      <div className="bg-white border-b border-border/60 shadow-[0_1px_12px_0_rgba(15,118,110,0.05)]">
        <div className="container mx-auto px-6 py-10">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary/70 mb-2">Explore</p>
          <h1 className="font-playfair text-4xl font-bold text-foreground mb-8">Find a Restaurant</h1>

          <form className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Search restaurants…"
                className="w-full pl-11 pr-4 h-12 rounded-full border border-border/70 bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            {/* City filter */}
            <select
              name="city"
              defaultValue={params.city ?? ""}
              className="h-12 rounded-full border border-border/70 bg-[#FAFAF8] px-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 min-w-36 transition-all"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Cuisine filter */}
            <select
              name="cuisine"
              defaultValue={params.cuisine ?? ""}
              className="h-12 rounded-full border border-border/70 bg-[#FAFAF8] px-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 min-w-40 transition-all"
            >
              <option value="">All Cuisines</option>
              {cuisines.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button
              type="submit"
              className="h-12 px-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-6 py-12">
        {restaurants.length === 0 ? (
          <div className="text-center py-24">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-border/60 shadow-sm">
              <Search className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h2 className="font-playfair text-2xl font-bold mb-2">No restaurants found</h2>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-8 font-medium">
              <span className="text-primary font-semibold">{restaurants.length}</span> restaurant{restaurants.length !== 1 ? "s" : ""} found
            </p>
            <Suspense fallback={<RestaurantGridSkeleton />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {restaurants.map((r) => (
                  <RestaurantCard key={r._id} restaurant={r} />
                ))}
              </div>
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}
