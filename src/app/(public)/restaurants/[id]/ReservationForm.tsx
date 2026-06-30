"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createReservation } from "@/actions/reservation.actions";
import { getTodayString } from "@/lib/utils";
import type { ITable } from "@/types";

const schema = z
  .object({
    tableId: z.string().min(1, "Please select a table"),
    date: z.string().min(1, "Please select a date"),
    startTime: z.string().min(1, "Please select a start time"),
    endTime: z.string().min(1, "Please select an end time"),
    partySize: z.number().int().min(1),
    notes: z.string().optional(),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

type FormData = z.infer<typeof schema>;

const TIME_SLOTS = [
  "11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30",
  "19:00","19:30","20:00","20:30","21:00","21:30","22:00",
];

interface ReservationFormProps {
  tables: ITable[];
  restaurantId: string;
}

export function ReservationForm({ tables, restaurantId }: ReservationFormProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedTableId = watch("tableId");
  const selectedTable = tables.find((t) => t._id === selectedTableId);

  async function onSubmit(data: FormData) {
    if (!session) {
      router.push("/login");
      return;
    }

    const formData = new FormData();
    formData.append("restaurantId", restaurantId);
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) formData.append(k, String(v));
    });

    const result = await createReservation(formData);
    if (result.success) {
      toast.success("Reservation confirmed!", {
        description: "Check your dashboard to manage it.",
      });
      router.push("/customer/reservations");
    } else {
      toast.error(result.error ?? "Failed to create reservation");
    }
  }

  if (!session || session.user.role !== "CUSTOMER") {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          {session
            ? "Only customers can make reservations."
            : "Sign in as a customer to reserve a table."}
        </p>
        {!session && (
          <Button asChild size="sm">
            <a href="/login">Sign In to Reserve</a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Table selector */}
      <div className="space-y-1.5">
        <Label htmlFor="tableId">Select Table</Label>
        <select
          id="tableId"
          {...register("tableId")}
          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Choose a table…</option>
          {tables.map((t) => (
            <option key={t._id} value={t._id}>
              Table {t.number} — seats {t.capacity}
            </option>
          ))}
        </select>
        {errors.tableId && <p className="text-xs text-destructive">{errors.tableId.message}</p>}
      </div>

      {/* Party size */}
      <div className="space-y-1.5">
        <Label htmlFor="partySize" className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> Party Size
          {selectedTable && (
            <span className="ml-auto text-xs text-muted-foreground font-normal">
              max {selectedTable.capacity}
            </span>
          )}
        </Label>
        <input
          id="partySize"
          type="number"
          min={1}
          max={selectedTable?.capacity ?? 20}
          {...register("partySize", { valueAsNumber: true })}
          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.partySize && <p className="text-xs text-destructive">{errors.partySize.message}</p>}
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="date" className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> Date
        </Label>
        <input
          id="date"
          type="date"
          min={getTodayString()}
          {...register("date")}
          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
      </div>

      {/* Start time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="startTime" className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Start
          </Label>
          <select
            id="startTime"
            {...register("startTime")}
            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select…</option>
            {TIME_SLOTS.slice(0, -1).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endTime">End</Label>
          <select
            id="endTime"
            {...register("endTime")}
            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select…</option>
            {TIME_SLOTS.slice(1).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Special Requests (optional)</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Allergies, occasion, seating preference…"
          className="resize-none"
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isSubmitting ? "Confirming…" : "Reserve Table"}
      </Button>
    </form>
  );
}
