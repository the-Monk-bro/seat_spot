"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Calendar, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { cancelReservation } from "@/actions/reservation.actions";
import { formatDate } from "@/lib/utils";
import type { IReservation } from "@/types";

interface CustomerReservationsClientProps {
  reservations: IReservation[];
}

export function CustomerReservationsClient({ reservations }: CustomerReservationsClientProps) {
  const [localReservations, setLocalReservations] = useState(reservations);
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function handleCancel(id: string) {
    setCancelling(id);
    const result = await cancelReservation(id);
    if (result.success) {
      setLocalReservations((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "CANCELLED" } : r))
      );
      toast.success("Reservation cancelled");
    } else {
      toast.error(result.error ?? "Failed to cancel");
    }
    setCancelling(null);
  }

  const today = new Date().toISOString().split("T")[0];
  const upcoming = localReservations.filter((r) => r.date >= today && r.status !== "CANCELLED");
  const past = localReservations.filter((r) => r.date < today || r.status === "CANCELLED");

  function ReservationCard({ r, showCancel }: { r: IReservation; showCancel: boolean }) {
    const rest = r.restaurant as { name: string; city: string };
    const table = r.table as { number: number; capacity: number };

    return (
      <div className="rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{rest.name}</h3>
              <StatusBadge status={r.status} />
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(r.date)}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.startTime} – {r.endTime}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{rest.city}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.partySize} guests</span>
            </div>
            <p className="text-xs text-muted-foreground">Table {table.number}</p>
            {r.notes && <p className="text-xs text-muted-foreground italic">"{r.notes}"</p>}
          </div>

          {showCancel && r.status !== "CANCELLED" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0 text-destructive hover:text-destructive hover:bg-red-50 border-red-200">
                  Cancel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Reservation</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel your reservation at {rest.name} on {formatDate(r.date)}?
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" size="sm">Keep Reservation</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={cancelling === r._id}
                    onClick={() => handleCancel(r._id)}
                  >
                    {cancelling === r._id && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                    Yes, Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming */}
      <section>
        <h2 className="font-semibold text-lg mb-4">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">No upcoming reservations.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((r) => <ReservationCard key={r._id} r={r} showCancel />)}
          </div>
        )}
      </section>

      {/* Past / Cancelled */}
      <section>
        <h2 className="font-semibold text-lg mb-4">Past & Cancelled ({past.length})</h2>
        {past.length === 0 ? (
          <p className="text-muted-foreground text-sm">No past reservations.</p>
        ) : (
          <div className="space-y-3">
            {past.map((r) => <ReservationCard key={r._id} r={r} showCancel={false} />)}
          </div>
        )}
      </section>
    </div>
  );
}
