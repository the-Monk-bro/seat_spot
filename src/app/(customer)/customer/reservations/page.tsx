import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Reservation from "@/models/Reservation";
import { CustomerReservationsClient } from "./ReservationsClient";
import type { IReservation } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Reservations" };

export default async function CustomerReservationsPage() {
  const session = await auth();
  await connectDB();

  const docs = await Reservation.find({ user: session!.user.id })
    .populate("restaurant", "name city")
    .populate("table", "number capacity")
    .sort({ date: -1 })
    .lean();

  const reservations: IReservation[] = JSON.parse(JSON.stringify(docs));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">My Reservations</h1>
      <p className="text-muted-foreground mb-8">All your dining reservations</p>
      <CustomerReservationsClient reservations={reservations} />
    </div>
  );
}
