import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, Phone, UtensilsCrossed } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { TableManager } from "./TableManager";
import { MenuManager } from "./MenuManager";
import { connectDB } from "@/lib/mongoose";
import Restaurant from "@/models/Restaurant";
import Table from "@/models/Table";
import MenuItem from "@/models/MenuItem";
import type { IRestaurant, ITable, IMenuItem } from "@/types";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  await connectDB();
  const r = await Restaurant.findById(id).lean() as IRestaurant | null;
  return { title: r ? `Manage — ${r.name}` : "Restaurant" };
}

export default async function OwnerRestaurantDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  await connectDB();

  const [restaurantDoc, tablesDoc, menuItemsDoc] = await Promise.all([
    Restaurant.findOne({ _id: id, owner: session!.user.id }).lean(),
    Table.find({ restaurant: id }).sort({ number: 1 }).lean(),
    MenuItem.find({ restaurant: id }).sort({ category: 1, name: 1 }).lean(),
  ]);

  if (!restaurantDoc) notFound();

  const restaurant: IRestaurant = JSON.parse(JSON.stringify(restaurantDoc));
  const tables: ITable[] = JSON.parse(JSON.stringify(tablesDoc));
  const menuItems: IMenuItem[] = JSON.parse(JSON.stringify(menuItemsDoc));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-28 rounded-xl overflow-hidden bg-muted shrink-0">
          {restaurant.coverImage ? (
            <Image src={restaurant.coverImage} alt={restaurant.name} fill className="object-cover" />
          ) : (
            <div className="h-full flex items-center justify-center">
              <UtensilsCrossed className="h-7 w-7 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <StatusBadge status={restaurant.status} />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span>{restaurant.cuisine}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{restaurant.city}</span>
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{restaurant.phone}</span>
          </div>
          {restaurant.status === "PENDING" && (
            <p className="text-xs text-amber-600 mt-2">⏳ Awaiting admin approval — not visible in search results yet</p>
          )}
          {restaurant.status === "REJECTED" && (
            <p className="text-xs text-destructive mt-2">❌ Application rejected by admin</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Tables */}
      <TableManager tables={tables} restaurantId={restaurant._id} />

      <Separator />

      {/* Menu */}
      <MenuManager items={menuItems} restaurantId={restaurant._id} />
    </div>
  );
}
