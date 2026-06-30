import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unauthorized | SeatSpot",
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="text-center max-w-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 mx-auto mb-6">
          <UtensilsCrossed className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You don&apos;t have permission to access this page.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
