import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, UtensilsCrossed, BookOpen } from "lucide-react";
import { connectDB } from "@/lib/mongoose";
import Restaurant from "@/models/Restaurant";
import { ReservationForm } from "./ReservationForm";
import type { IRestaurant } from "@/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  await connectDB();
  const restaurant = await Restaurant.findOne({ _id: id, status: "APPROVED" }).lean() as IRestaurant | null;
  if (!restaurant) return { title: "Restaurant Not Found" };
  return {
    title: `Reserve at ${restaurant.name}`,
    description: restaurant.description,
  };
}

export default async function RestaurantDetailPage({ params }: Props) {
  const { id } = await params;
  await connectDB();

  const restaurantDoc = await Restaurant.findOne({ _id: id, status: "APPROVED" }).lean();
  if (!restaurantDoc) notFound();

  const restaurant: IRestaurant = JSON.parse(JSON.stringify(restaurantDoc));

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Cover Image */}
      <div className="relative h-52 md:h-72 w-full bg-muted">
        {restaurant.coverImage ? (
          <Image
            src={restaurant.coverImage}
            alt={restaurant.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-accent">
            <UtensilsCrossed className="h-16 w-16 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Restaurant name overlaid on cover */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <div className="container mx-auto flex items-end gap-4">
            {restaurant.logo && (
              <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-white/80 bg-white shadow-lg shrink-0">
                <Image src={restaurant.logo} alt="Logo" fill className="object-contain p-1" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="inline-block rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-xs font-semibold text-white mb-1">
                {restaurant.cuisine}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
                {restaurant.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-white/80 text-xs">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {restaurant.address}, {restaurant.city}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {restaurant.phone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Description + Menu button row */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <p className="text-muted-foreground leading-relaxed flex-1">
            {restaurant.description}
          </p>
          <Link
            href={`/restaurants/${id}/menu`}
            className="flex items-center gap-2 shrink-0 rounded-full border border-primary/30 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
          >
            <BookOpen className="h-4 w-4" />
            View Menu
          </Link>
        </div>

        {/* Full-width booking card */}
        <div className="rounded-2xl border bg-white shadow-md p-6 md:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-primary/70 mb-1">
              Visual Table Booking
            </p>
            <h2 className="text-xl font-bold text-foreground">Reserve Your Seat</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Pick your date, choose your table on the floor map, and lock it in.
            </p>
          </div>
          <ReservationForm restaurantId={restaurant._id} />
        </div>
      </div>
    </div>
  );
}
