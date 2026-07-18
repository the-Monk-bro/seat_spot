"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calendar,
  Clock,
  Users,
  Loader2,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createReservation } from "@/actions/reservation.actions";
import { getTodayString } from "@/lib/utils";
import { FloorMap, type TableSlot } from "./FloorMap";

/* ─── Zod schema ─────────────────────────────────────────────── */
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

/* ─── Props ───────────────────────────────────────────────────── */
interface ReservationFormProps {
  restaurantId: string;
}

/* ─── Step indicator helper ──────────────────────────────────── */
type StepState = "done" | "active" | "inactive";

function StepIndicator({
  step,
  label,
  state,
}: {
  step: number;
  label: string;
  state: StepState;
}) {
  return (
    <>
      <div
        className={`reservation-step-number ${state}`}
        aria-current={state === "active" ? "step" : undefined}
      >
        {state === "done" ? "✓" : step}
      </div>
      <span
        className={`reservation-step-label ${
          state === "active"
            ? "text-foreground"
            : state === "done"
            ? "text-emerald-700"
            : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export function ReservationForm({ restaurantId }: ReservationFormProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedTable, setSelectedTable] = useState<TableSlot | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { partySize: 1 },
  });

  const date = watch("date");
  const startTime = watch("startTime");
  const endTime = watch("endTime");

  /* ── Step 1 → 2: validate date & times first ── */
  async function goToStep2() {
    const valid = await trigger(["date", "startTime", "endTime"]);
    if (!valid) return;
    if (startTime >= endTime) {
      toast.error("End time must be after start time.");
      return;
    }
    setCurrentStep(2);
  }

  /* ── Step 2 → 3: table must be selected ── */
  function goToStep3() {
    if (!selectedTable) {
      toast.error("Please select a table from the floor plan.");
      return;
    }
    setCurrentStep(3);
  }

  /* ── Table selected from FloorMap ── */
  const handleTableSelect = useCallback(
    (table: TableSlot) => {
      setSelectedTable(table);
      setValue("tableId", table._id, { shouldValidate: true });
      // default party size to table capacity
      setValue("partySize", table.capacity, { shouldValidate: false });
    },
    [setValue]
  );

  /* ── Form submit ── */
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
      toast.success("Reservation confirmed! 🎉", {
        description: "Head to your dashboard to manage it.",
      });
      router.push("/customer/reservations");
    } else {
      toast.error(result.error ?? "Failed to create reservation");
    }
  }

  /* ── Not-customer guard ── */
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Step progress bar ── */}
      <div className="reservation-step-header">
        <StepIndicator
          step={1}
          label="Date & Time"
          state={currentStep === 1 ? "active" : "done"}
        />
        <div className="reservation-step-connector" />
        <StepIndicator
          step={2}
          label="Pick Table"
          state={
            currentStep === 1
              ? "inactive"
              : currentStep === 2
              ? "active"
              : "done"
          }
        />
        <div className="reservation-step-connector" />
        <StepIndicator
          step={3}
          label="Confirm"
          state={currentStep < 3 ? "inactive" : "active"}
        />
      </div>

      {/* ══ STEP 1: Date & Time ══ */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Date
            </Label>
            <input
              id="date"
              type="date"
              min={getTodayString()}
              {...register("date")}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startTime" className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                From
              </Label>
              <select
                id="startTime"
                {...register("startTime")}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select…</option>
                {TIME_SLOTS.slice(0, -1).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.startTime && (
                <p className="text-xs text-destructive">
                  {errors.startTime.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endTime">Until</Label>
              <select
                id="endTime"
                {...register("endTime")}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select…</option>
                {TIME_SLOTS.slice(1).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.endTime && (
                <p className="text-xs text-destructive">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          <Button type="button" className="w-full" onClick={goToStep2}>
            See Available Tables →
          </Button>
        </div>
      )}

      {/* ══ STEP 2: Floor Map ══ */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Recapped date/time chip */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{date}</span>
            <Clock className="h-3.5 w-3.5 shrink-0 ml-2" />
            <span>
              {startTime} – {endTime}
            </span>
          </div>

          {/* Hidden tableId field (registered for validation) */}
          <input type="hidden" {...register("tableId")} />
          {errors.tableId && (
            <p className="text-xs text-destructive">{errors.tableId.message}</p>
          )}

          {/* The visual map */}
          <FloorMap
            restaurantId={restaurantId}
            date={date}
            startTime={startTime}
            endTime={endTime}
            selectedTableDocId={selectedTable?._id ?? ""}
            onSelectTable={handleTableSelect}
          />

          {/* Selected table summary */}
          {selectedTable && (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-emerald-800">
                  Table {selectedTable.number}
                </span>
                <span className="text-emerald-600 ml-1.5">
                  · seats {selectedTable.capacity}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setCurrentStep(1);
                setSelectedTable(null);
                setValue("tableId", "");
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={goToStep3}
              disabled={!selectedTable}
            >
              Confirm Table →
            </Button>
          </div>
        </div>
      )}

      {/* ══ STEP 3: Details & Submit ══ */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Summary chip */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">
              Your Reservation
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-800">
              <Calendar className="h-3.5 w-3.5" /> {date}
              <Clock className="h-3.5 w-3.5 ml-2" /> {startTime} – {endTime}
            </div>
            {selectedTable && (
              <p className="text-xs text-emerald-800 font-medium">
                Table {selectedTable.number} · {selectedTable.capacity} seats
              </p>
            )}
          </div>

          {/* Party size */}
          <div className="space-y-1.5">
            <Label htmlFor="partySize" className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Party Size
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
            {errors.partySize && (
              <p className="text-xs text-destructive">
                {errors.partySize.message}
              </p>
            )}
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

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setCurrentStep(2)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isSubmitting ? "Reserving…" : "Reserve Table 🎉"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
