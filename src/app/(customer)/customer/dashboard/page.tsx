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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {session!.user.name?.split(" ")[0]}! 👋</h1>
        <p className="text-muted-foreground mt-1">Manage your restaurant reservations.</p>
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
          <div className="rounded-xl border bg-white p-8 text-center">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium mb-1">No upcoming reservations</p>
            <p className="text-sm text-muted-foreground mb-4">Find a restaurant and book your next dining experience</p>
            <Button asChild size="sm">
              <Link href="/restaurants">Browse Restaurants</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingParsed.map((r) => {
              const rest = r.restaurant as { name: string; city: string };
              const table = r.table as { number: number; capacity: number };
              return (
                <div key={r._id} className="rounded-xl border bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition-shadow">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{rest.name}</h3>
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
        <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/restaurants" className="rounded-xl border bg-white p-5 hover:shadow-sm hover:border-primary/30 transition-all group">
            <h3 className="font-semibold group-hover:text-primary transition-colors">Find a Restaurant</h3>
            <p className="text-sm text-muted-foreground mt-1">Browse approved restaurants and make a reservation</p>
          </Link>
          <Link href="/customer/reservations" className="rounded-xl border bg-white p-5 hover:shadow-sm hover:border-primary/30 transition-all group">
            <h3 className="font-semibold group-hover:text-primary transition-colors">Reservation History</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {pastParsed.length > 0 ? `${pastParsed.length} past reservation${pastParsed.length !== 1 ? "s" : ""}` : "No past reservations yet"}
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
