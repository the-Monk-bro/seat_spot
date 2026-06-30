"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmReservation, cancelReservation } from "@/actions/reservation.actions";
import type { ReservationStatus } from "@/types";

interface OwnerReservationActionsProps {
  reservationId: string;
  status: ReservationStatus;
}

export function OwnerReservationActions({ reservationId, status }: OwnerReservationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"confirm" | "cancel" | null>(null);

  if (status === "CANCELLED") return null;

  async function handleConfirm() {
    setLoading("confirm");
    const result = await confirmReservation(reservationId);
    if (result.success) {
      toast.success("Reservation confirmed");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed");
    }
    setLoading(null);
  }

  async function handleCancel() {
    setLoading("cancel");
    const result = await cancelReservation(reservationId);
    if (result.success) {
      toast.success("Reservation cancelled");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed");
    }
    setLoading(null);
  }

  return (
    <div className="flex gap-2 shrink-0">
      {status === "PENDING" && (
        <Button size="sm" onClick={handleConfirm} disabled={loading !== null}>
          {loading === "confirm" && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          Confirm
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:bg-red-50 border-red-200"
        onClick={handleCancel}
        disabled={loading !== null}
      >
        {loading === "cancel" && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
        Cancel
      </Button>
    </div>
  );
}
