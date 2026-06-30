import { connectDB } from "@/lib/mongoose";
import Restaurant from "@/models/Restaurant";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminApprovalActions } from "./ApprovalActions";
import type { IRestaurant } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Restaurant Approvals" };

export default async function AdminRestaurantsPage() {
  await connectDB();

  const [pending, others] = await Promise.all([
    Restaurant.find({ status: "PENDING" })
      .populate("owner", "name email")
      .sort({ createdAt: 1 })
      .lean(),
    Restaurant.find({ status: { $in: ["APPROVED", "REJECTED"] } })
      .populate("owner", "name email")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean(),
  ]);

  const allDocs: IRestaurant[] = JSON.parse(JSON.stringify([...pending, ...others]));

  function RestaurantRow({ r }: { r: IRestaurant }) {
    const owner = r.owner as { name: string; email: string };
    return (
      <div className="rounded-xl border bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{r.name}</h3>
            <StatusBadge status={r.status} />
          </div>
          <p className="text-xs text-muted-foreground">{r.cuisine} · {r.city}</p>
          <p className="text-xs text-muted-foreground">Owner: {owner.name} ({owner.email})</p>
        </div>
        <AdminApprovalActions restaurantId={r._id} currentStatus={r.status} />
      </div>
    );
  }

  const pendingList: IRestaurant[] = JSON.parse(JSON.stringify(pending));
  const othersList: IRestaurant[] = JSON.parse(JSON.stringify(others));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Restaurant Management</h1>
        <p className="text-muted-foreground mt-1">Approve or reject restaurant applications</p>
      </div>

      <section>
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          Pending Approval
          {pendingList.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              {pendingList.length}
            </span>
          )}
        </h2>
        {pendingList.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending applications. 🎉</p>
        ) : (
          <div className="space-y-3">
            {pendingList.map((r) => <RestaurantRow key={r._id} r={r} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-4">All Restaurants ({othersList.length + pendingList.length})</h2>
        <div className="space-y-3">
          {allDocs.map((r) => <RestaurantRow key={r._id} r={r} />)}
        </div>
      </section>
    </div>
  );
}
