import Link from "next/link";
import Image from "next/image";
import { MapPin, UtensilsCrossed, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { IRestaurant } from "@/types";

interface RestaurantCardProps {
  restaurant: IRestaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link href={`/restaurants/${restaurant._id}`} className="block group">
      <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        {/* Cover image */}
        <div className="relative aspect-video bg-muted">
          {restaurant.coverImage ? (
            <Image
              src={restaurant.coverImage}
              alt={restaurant.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-accent">
              <UtensilsCrossed className="h-10 w-10 text-primary/40" />
            </div>
          )}
          {/* Cuisine pill */}
          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
              {restaurant.cuisine}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-base leading-tight truncate">
                {restaurant.name}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{restaurant.city}</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
          </div>

          {restaurant.description && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {restaurant.description}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
