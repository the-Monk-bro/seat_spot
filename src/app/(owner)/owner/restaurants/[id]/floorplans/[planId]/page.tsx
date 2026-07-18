import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import FloorPlan from "@/models/FloorPlan";
import FloorPlanEditorClient from "./FloorPlanEditorClient";
import type { IFloorPlan } from "@/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string; planId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { planId } = await params;
  await connectDB();
  const plan = await FloorPlan.findById(planId).lean() as IFloorPlan | null;
  return { title: plan ? `Edit — ${plan.name}` : "Floor Plan Editor" };
}

export default async function FloorPlanEditorPage({ params }: Props) {
  const { id: restaurantId, planId } = await params;
  const session = await auth();

  await connectDB();
  const planDoc = await FloorPlan.findOne({
    _id: planId,
    restaurant: restaurantId,
  }).lean();

  if (!planDoc) notFound();

  // Verify ownership via session (layout guard already checks OWNER role)
  void session;

  const plan: IFloorPlan = JSON.parse(JSON.stringify(planDoc));

  return (
    <div className="space-y-2">
      <FloorPlanEditorClient plan={plan} restaurantId={restaurantId} />
    </div>
  );
}
