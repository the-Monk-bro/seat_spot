import { auth } from "@/lib/auth";
import { Calendar, Clock, MapPin, Users, Loader2 } from "lucide-react";
import { connectDB } from "@/lib/mongoose";
import Restaurant from "@/models/Restaurant";
import Reservation from "@/models/Reservation";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { IReservation } from "@/types";
import { OwnerReservationActions } from "@/app/(owner)/owner/reservations/ReservationActions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reservations" };

export default async function OwnerReservationsPage() {
  const session = await auth();
  await connectDB();

  const restaurants = await Restaurant.find({ owner: session!.user.id }).lean();
  const restaurantIds = restaurants.map((r) => r._id);

  const docs = await Reservation.find({ restaurant: { $in: restaurantIds } })
    .populate("restaurant", "name city")
    .populate("table", "number capacity")
    .populate("user", "name email")
    .sort({ date: -1 })
    .lean();

  const reservations: IReservation[] = JSON.parse(JSON.stringify(docs));
  const today = new Date().toISOString().split("T")[0];

  const upcoming = reservations.filter((r) => r.date >= today && r.status !== "CANCELLED");
  const past = reservations.filter((r) => r.date < today || r.status === "CANCELLED");

  function ReservationRow({ r }: { r: IReservation }) {
    const rest = r.restaurant as { name: string; city: string };
    const table = r.table as { number: number };
    const user = r.user as { name: string; email: string };

    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{rest.name}</span>
              <StatusBadge status={r.status} />
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(r.date)}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.startTime}–{r.endTime}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.partySize} guests</span>
              <span>Table {table.number}</span>
            </div>
            <p className="text-xs text-muted-foreground">Guest: {user.name} ({user.email})</p>
          </div>
          <OwnerReservationActions reservationId={r._id} status={r.status} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Reservations</h1>
        <p className="text-muted-foreground mt-1">{reservations.length} total reservations across your restaurants</p>
      </div>

      <section>
        <h2 className="font-semibold text-lg mb-4">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">No upcoming reservations.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((r) => <ReservationRow key={r._id} r={r} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-4">Past & Cancelled ({past.length})</h2>
        {past.length === 0 ? (
          <p className="text-muted-foreground text-sm">No past reservations.</p>
        ) : (
          <div className="space-y-3">
            {past.map((r) => <ReservationRow key={r._id} r={r} />)}
          </div>
        )}
      </section>
    </div>
  );
}
