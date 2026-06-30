import { auth } from "@/lib/auth";
import Link from "next/link";
import { ArrowRight, Store, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { connectDB } from "@/lib/mongoose";
import Restaurant from "@/models/Restaurant";
import Reservation from "@/models/Reservation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Owner Dashboard" };

export default async function OwnerDashboard() {
  const session = await auth();
  await connectDB();

  const restaurants = await Restaurant.find({ owner: session!.user.id }).lean();
  const restaurantIds = restaurants.map((r) => r._id);
  const today = new Date().toISOString().split("T")[0];

  const [totalReservations, upcomingReservations] = await Promise.all([
    Reservation.countDocuments({ restaurant: { $in: restaurantIds } }),
    Reservation.countDocuments({
      restaurant: { $in: restaurantIds },
      date: { $gte: today },
      status: { $ne: "CANCELLED" },
    }),
  ]);

  const approved = restaurants.filter((r) => r.status === "APPROVED").length;
  const pending = restaurants.filter((r) => r.status === "PENDING").length;

  const stats = [
    { label: "Total Restaurants", value: restaurants.length, icon: Store, color: "bg-blue-50 text-blue-600" },
    { label: "Approved", value: approved, icon: Store, color: "bg-green-50 text-green-600" },
    { label: "Upcoming Reservations", value: upcomingReservations, icon: Calendar, color: "bg-orange-50 text-orange-600" },
    { label: "Total Reservations", value: totalReservations, icon: Clock, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Owner Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your restaurants and reservations.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-white p-5">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/owner/restaurants" className="group rounded-xl border bg-white p-5 hover:shadow-sm hover:border-primary/30 transition-all flex items-center justify-between">
          <div>
            <h3 className="font-semibold group-hover:text-primary transition-colors">Manage Restaurants</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {pending > 0 ? `${pending} awaiting approval` : "All up to date"}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>

        <Link href="/owner/reservations" className="group rounded-xl border bg-white p-5 hover:shadow-sm hover:border-primary/30 transition-all flex items-center justify-between">
          <div>
            <h3 className="font-semibold group-hover:text-primary transition-colors">View Reservations</h3>
            <p className="text-sm text-muted-foreground mt-1">{upcomingReservations} upcoming</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
