import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Phone, UtensilsCrossed } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { connectDB } from "@/lib/mongoose";
import Restaurant from "@/models/Restaurant";
import Table from "@/models/Table";
import MenuItem from "@/models/MenuItem";
import { ReservationForm } from "./ReservationForm";
import { formatPrice } from "@/lib/utils";
import type { IRestaurant, ITable, IMenuItem } from "@/types";
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
    title: restaurant.name,
    description: restaurant.description,
  };
}

export default async function RestaurantDetailPage({ params }: Props) {
  const { id } = await params;
  await connectDB();

  const [restaurantDoc, tablesDoc, menuItemsDoc] = await Promise.all([
    Restaurant.findOne({ _id: id, status: "APPROVED" }).lean(),
    Table.find({ restaurant: id }).sort({ number: 1 }).lean(),
    MenuItem.find({ restaurant: id }).sort({ category: 1, name: 1 }).lean(),
  ]);

  if (!restaurantDoc) notFound();

  const restaurant: IRestaurant = JSON.parse(JSON.stringify(restaurantDoc));
  const tables: ITable[] = JSON.parse(JSON.stringify(tablesDoc));
  const menuItems: IMenuItem[] = JSON.parse(JSON.stringify(menuItemsDoc));

  // Group menu items by category
  const menuByCategory = menuItems.reduce<Record<string, IMenuItem[]>>((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      {/* Cover Image */}
      <div className="relative h-56 md:h-80 w-full bg-muted">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Info + Menu */}
          <div className="lg:col-span-2 space-y-8">
            {/* Restaurant header */}
            <div className="flex items-start gap-4">
              {restaurant.logo && (
                <div className="relative h-16 w-16 rounded-xl overflow-hidden border bg-white shadow-sm shrink-0">
                  <Image src={restaurant.logo} alt="Logo" fill className="object-contain p-1" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {restaurant.cuisine}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">{restaurant.name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {restaurant.address}, {restaurant.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {restaurant.phone}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">{restaurant.description}</p>

            <Separator />

            {/* Menu */}
            <div>
              <h2 className="text-xl font-bold mb-6">Menu</h2>
              {Object.keys(menuByCategory).length === 0 ? (
                <p className="text-muted-foreground text-sm">No menu items yet.</p>
              ) : (
                <div className="space-y-8">
                  {Object.entries(menuByCategory).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="h-px flex-1 bg-border" />
                        {category}
                        <span className="h-px flex-1 bg-border" />
                      </h3>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div
                            key={item._id}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            {item.image && (
                              <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0">
                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <span className="font-semibold text-primary shrink-0 text-sm">
                                  {formatPrice(item.price)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Reservation form */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-2xl border bg-white shadow-sm p-6">
              <h2 className="text-lg font-bold mb-5">Reserve a Table</h2>
              <ReservationForm tables={tables} restaurantId={restaurant._id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
