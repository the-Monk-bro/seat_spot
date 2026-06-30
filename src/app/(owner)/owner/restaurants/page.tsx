import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { MapPin, UtensilsCrossed, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateRestaurantDialog } from "./CreateRestaurantDialog";
import { connectDB } from "@/lib/mongoose";
import Restaurant from "@/models/Restaurant";
import type { IRestaurant } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Restaurants" };

export default async function OwnerRestaurantsPage() {
  const session = await auth();
  await connectDB();

  const docs = await Restaurant.find({ owner: session!.user.id }).sort({ createdAt: -1 }).lean();
  const restaurants: IRestaurant[] = JSON.parse(JSON.stringify(docs));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Restaurants</h1>
          <p className="text-muted-foreground mt-1">{restaurants.length} restaurant{restaurants.length !== 1 ? "s" : ""}</p>
        </div>
        <CreateRestaurantDialog />
      </div>

      {restaurants.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No restaurants yet</h2>
          <p className="text-muted-foreground mb-6">Create your first restaurant to get started</p>
          <CreateRestaurantDialog />
        </div>
      ) : (
        <div className="space-y-4">
          {restaurants.map((r) => (
            <Link key={r._id} href={`/owner/restaurants/${r._id}`} className="group block">
              <div className="rounded-xl border bg-white p-4 flex items-center gap-4 hover:shadow-sm hover:border-primary/30 transition-all">
                {/* Cover/Logo */}
                <div className="relative h-16 w-24 rounded-lg overflow-hidden bg-muted shrink-0">
                  {r.coverImage ? (
                    <Image src={r.coverImage} alt={r.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <UtensilsCrossed className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{r.name}</h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.cuisine}</span>
                    <span className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" />{r.city}</span>
                  </div>
                  {r.status === "PENDING" && (
                    <p className="text-xs text-amber-600 mt-1">⏳ Awaiting admin approval</p>
                  )}
                  {r.status === "REJECTED" && (
                    <p className="text-xs text-red-600 mt-1">❌ Application rejected</p>
                  )}
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
