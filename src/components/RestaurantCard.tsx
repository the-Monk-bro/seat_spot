import Link from "next/link";
import Image from "next/image";
import { MapPin, UtensilsCrossed } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { IRestaurant } from "@/types";

interface RestaurantCardProps {
  restaurant: IRestaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link href={`/restaurants/${restaurant._id}`} className="block group">
      <Card className="overflow-hidden border border-border/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 bg-white rounded-[16px]">
        {/* Cover image — 4:3 editorial ratio */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {restaurant.coverImage ? (
            <Image
              src={restaurant.coverImage}
              alt={restaurant.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100/50">
              <UtensilsCrossed className="h-12 w-12 text-primary/30" />
            </div>
          )}
          {/* Gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Cuisine pill */}
          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm tracking-wide">
              {restaurant.cuisine}
            </span>
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-semibold text-base leading-tight font-playfair text-foreground group-hover:text-primary transition-colors duration-200">
            {restaurant.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
            <span>{restaurant.city}</span>
          </div>

          {restaurant.description && (
            <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {restaurant.description}
            </p>
          )}

          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs font-medium text-primary/80">View menu & reserve</span>
            <span className="text-primary text-sm font-semibold group-hover:translate-x-0.5 transition-transform duration-200">→</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
