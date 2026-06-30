import { auth } from "@/lib/auth";
import Link from "next/link";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { connectDB } from "@/lib/mongoose";
import Reservation from "@/models/Reservation";
import { formatDate } from "@/lib/utils";
import type { IReservation } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Dashboard" };

export default async function CustomerDashboard() {
  const session = await auth();
  await connectDB();

  const today = new Date().toISOString().split("T")[0];

  const [upcoming, past] = await Promise.all([
    Reservation.find({ user: session!.user.id, date: { $gte: today }, status: { $ne: "CANCELLED" } })
      .populate("restaurant", "name city")
      .populate("table", "number capacity")
      .sort({ date: 1 })
      .limit(5)
      .lean(),
    Reservation.find({ user: session!.user.id, date: { $lt: today } })
      .populate("restaurant", "name city")
      .sort({ date: -1 })
      .limit(3)
      .lean(),
  ]);

  const upcomingParsed: IReservation[] = JSON.parse(JSON.stringify(upcoming));
  const pastParsed: IReservation[] = JSON.parse(JSON.stringify(past));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-playfair text-3xl font-bold text-foreground">Welcome, {session!.user.name?.split(" ")[0]}! 👋</h1>
        <p className="text-muted-foreground mt-1.5">Manage your restaurant reservations.</p>
      </div>

      {/* Upcoming */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Upcoming Reservations</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/customer/reservations" className="flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {upcomingParsed.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 border border-primary/15">
              <Calendar className="h-7 w-7 text-primary/60" />
            </div>
            <p className="font-playfair font-semibold text-lg mb-1">No upcoming reservations</p>
            <p className="text-sm text-muted-foreground mb-5">Find a restaurant and book your next dining experience</p>
            <Button asChild size="sm" className="rounded-full px-6">
              <Link href="/restaurants">Browse Restaurants</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingParsed.map((r) => {
              const rest = r.restaurant as { name: string; city: string };
              const table = r.table as { number: number; capacity: number };
              return (
                <div key={r._id} className="rounded-2xl border border-border/60 bg-white overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-all duration-200">
                  {/* Emerald accent bar */}
                  <div className="hidden sm:block w-1 self-stretch bg-primary rounded-l-2xl shrink-0" />
                  <div className="p-5 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold font-playfair">{rest.name}</h3>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(r.date)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.startTime} – {r.endTime}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{rest.city}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Table {table.number} · {r.partySize} guests</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section>
        <h2 className="font-playfair font-bold text-xl mb-5">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/restaurants" className="rounded-2xl border border-border/60 bg-white p-6 hover:shadow-md hover:border-primary/30 transition-all duration-200 group">
            <h3 className="font-semibold text-base group-hover:text-primary transition-colors">Find a Restaurant</h3>
            <p className="text-sm text-muted-foreground mt-1.5">Browse approved restaurants and make a reservation</p>
          </Link>
          <Link href="/customer/reservations" className="rounded-2xl border border-border/60 bg-white p-6 hover:shadow-md hover:border-primary/30 transition-all duration-200 group">
            <h3 className="font-semibold text-base group-hover:text-primary transition-colors">Reservation History</h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              {pastParsed.length > 0 ? `${pastParsed.length} past reservation${pastParsed.length !== 1 ? "s" : ""}` : "No past reservations yet"}
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
