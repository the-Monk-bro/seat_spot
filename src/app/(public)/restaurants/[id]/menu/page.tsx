import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import { connectDB } from "@/lib/mongoose";
import Restaurant from "@/models/Restaurant";
import MenuItem from "@/models/MenuItem";
import { formatPrice } from "@/lib/utils";
import type { IRestaurant, IMenuItem } from "@/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  await connectDB();
  const restaurant = await Restaurant.findOne({ _id: id, status: "APPROVED" }).lean() as IRestaurant | null;
  if (!restaurant) return { title: "Menu Not Found" };
  return {
    title: `Menu — ${restaurant.name}`,
    description: `Explore the full menu at ${restaurant.name}.`,
  };
}

export default async function RestaurantMenuPage({ params }: Props) {
  const { id } = await params;
  await connectDB();

  const [restaurantDoc, menuItemsDoc] = await Promise.all([
    Restaurant.findOne({ _id: id, status: "APPROVED" }).lean(),
    MenuItem.find({ restaurant: id }).sort({ category: 1, name: 1 }).lean(),
  ]);

  if (!restaurantDoc) notFound();

  const restaurant: IRestaurant = JSON.parse(JSON.stringify(restaurantDoc));
  const menuItems: IMenuItem[] = JSON.parse(JSON.stringify(menuItemsDoc));

  const menuByCategory = menuItems.reduce<Record<string, IMenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(menuByCategory);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Page header */}
      <div className="bg-white border-b border-border/60 shadow-[0_1px_12px_0_rgba(15,118,110,0.05)]">
        <div className="container mx-auto px-6 py-6">
          {/* Back link */}
          <Link
            href={`/restaurants/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to booking
          </Link>

          {/* Restaurant identity */}
          <div className="flex items-center gap-4">
            {restaurant.logo ? (
              <div className="relative h-14 w-14 rounded-xl overflow-hidden border bg-white shadow-sm shrink-0">
                <Image src={restaurant.logo} alt="Logo" fill className="object-contain p-1" />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <UtensilsCrossed className="h-7 w-7 text-primary/40" />
              </div>
            )}
            <div>
              <span className="text-xs font-semibold tracking-[0.12em] uppercase text-primary/70">
                {restaurant.cuisine}
              </span>
              <h1 className="font-playfair text-2xl font-bold text-foreground leading-tight">
                {restaurant.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Full Menu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category nav pills (sticky) */}
      {categories.length > 1 && (
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-border/50">
          <div className="container mx-auto px-6">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
              {categories.map((cat) => (
                <a
                  key={cat}
                  href={`#cat-${cat.replace(/\s+/g, "-").toLowerCase()}`}
                  className="flex-shrink-0 rounded-full border border-border/70 bg-white px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all duration-150"
                >
                  {cat}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu content */}
      <div className="container mx-auto px-6 py-10 max-w-4xl">
        {categories.length === 0 ? (
          <div className="text-center py-24">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-border/60 shadow-sm">
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h2 className="font-playfair text-2xl font-bold mb-2">No menu yet</h2>
            <p className="text-muted-foreground">
              This restaurant hasn&apos;t added menu items yet.
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {Object.entries(menuByCategory).map(([category, items]) => (
              <section
                key={category}
                id={`cat-${category.replace(/\s+/g, "-").toLowerCase()}`}
                className="scroll-mt-24"
              >
                {/* Category heading */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="h-px flex-1 bg-border" />
                  <h2 className="font-playfair text-xl font-bold text-foreground px-2">
                    {category}
                  </h2>
                  <span className="h-px flex-1 bg-border" />
                </div>

                {/* Items grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div
                      key={item._id}
                      className="group flex items-start gap-4 p-4 rounded-2xl bg-white border border-border/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
                    >
                      {item.image ? (
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0 bg-muted">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                          <UtensilsCrossed className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm text-foreground leading-snug">
                            {item.name}
                          </h3>
                          <span className="font-bold text-primary shrink-0 text-sm">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Reserve CTA at bottom */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            Ready to come in? Lock in your table now.
          </p>
          <Link
            href={`/restaurants/${id}`}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
          >
            Reserve a Table →
          </Link>
        </div>
      </div>
    </div>
  );
}
