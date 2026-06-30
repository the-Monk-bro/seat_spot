"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveRestaurant } from "@/actions/restaurant.actions";
import type { RestaurantStatus } from "@/types";

interface AdminApprovalActionsProps {
  restaurantId: string;
  currentStatus: RestaurantStatus;
}

export function AdminApprovalActions({ restaurantId, currentStatus }: AdminApprovalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"APPROVED" | "REJECTED" | null>(null);

  async function handleAction(status: "APPROVED" | "REJECTED") {
    setLoading(status);
    const result = await approveRestaurant(restaurantId, status);
    if (result.success) {
      toast.success(status === "APPROVED" ? "Restaurant approved!" : "Restaurant rejected");
      router.refresh();
    } else {
      toast.error(result.error ?? "Action failed");
    }
    setLoading(null);
  }

  return (
    <div className="flex gap-2">
      {currentStatus !== "APPROVED" && (
        <Button
          size="sm"
          onClick={() => handleAction("APPROVED")}
          disabled={loading !== null}
          className="bg-green-600 hover:bg-green-700 gap-1.5"
        >
          {loading === "APPROVED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
          Approve
        </Button>
      )}
      {currentStatus !== "REJECTED" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction("REJECTED")}
          disabled={loading !== null}
          className="text-destructive hover:bg-red-50 border-red-200 gap-1.5"
        >
          {loading === "REJECTED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
          Reject
        </Button>
      )}
    </div>
  );
}
