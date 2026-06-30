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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border bg-white">
          <Skeleton className="aspect-video w-full" />
          <div className="p-4 space-y-2">
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
    <div className="min-h-screen bg-muted/20">
      {/* Page header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Find a Restaurant</h1>

          <form className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Search restaurants…"
                className="w-full pl-9 pr-4 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* City filter */}
            <select
              name="city"
              defaultValue={params.city ?? ""}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-36"
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
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-40"
            >
              <option value="">All Cuisines</option>
              {cuisines.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-10">
        {restaurants.length === 0 ? (
          <div className="text-center py-20">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No restaurants found</h2>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {restaurants.length} restaurant{restaurants.length !== 1 ? "s" : ""} found
            </p>
            <Suspense fallback={<RestaurantGridSkeleton />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
