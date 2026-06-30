import { connectDB } from "@/lib/mongoose";
import Restaurant from "@/models/Restaurant";
import User from "@/models/User";
import Reservation from "@/models/Reservation";
import { Store, Users, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  await connectDB();

  const [
    totalRestaurants,
    pendingRestaurants,
    approvedRestaurants,
    totalUsers,
    totalReservations,
  ] = await Promise.all([
    Restaurant.countDocuments(),
    Restaurant.countDocuments({ status: "PENDING" }),
    Restaurant.countDocuments({ status: "APPROVED" }),
    User.countDocuments(),
    Reservation.countDocuments(),
  ]);

  const stats = [
    { label: "Total Restaurants", value: totalRestaurants, icon: Store, color: "bg-blue-50 text-blue-600" },
    { label: "Pending Approval", value: pendingRestaurants, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Approved", value: approvedRestaurants, icon: Store, color: "bg-green-50 text-green-600" },
    { label: "Total Users", value: totalUsers, icon: Users, color: "bg-purple-50 text-purple-600" },
    { label: "Total Reservations", value: totalReservations, icon: Calendar, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

      {pendingRestaurants > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-800">
              {pendingRestaurants} restaurant{pendingRestaurants !== 1 ? "s" : ""} awaiting approval
            </p>
            <p className="text-sm text-amber-700 mt-0.5">Review and approve or reject restaurant listings</p>
          </div>
          <Link
            href="/admin/restaurants"
            className="flex items-center gap-1 text-sm font-semibold text-amber-800 hover:text-amber-900"
          >
            Review <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/restaurants" className="group rounded-xl border bg-white p-5 hover:shadow-sm hover:border-primary/30 transition-all flex items-center justify-between">
          <div>
            <h3 className="font-semibold group-hover:text-primary transition-colors">Manage Restaurants</h3>
            <p className="text-sm text-muted-foreground mt-1">Approve or reject restaurant listings</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>
        <Link href="/admin/users" className="group rounded-xl border bg-white p-5 hover:shadow-sm hover:border-primary/30 transition-all flex items-center justify-between">
          <div>
            <h3 className="font-semibold group-hover:text-primary transition-colors">Manage Users</h3>
            <p className="text-sm text-muted-foreground mt-1">View all platform users and their roles</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
