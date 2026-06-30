import { redirect } from "next/navigation";
// The landing page lives at app/page.tsx (root level).
// This file prevents a routing conflict with app/(public)/page.tsx
export default function PublicGroupRoot() {
  redirect("/");
}
