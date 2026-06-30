import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { href: "/owner/dashboard", label: "Dashboard", icon: "dashboard" as const },
  { href: "/owner/restaurants", label: "Restaurants", icon: "restaurants" as const },
  { href: "/owner/reservations", label: "Reservations", icon: "reservations" as const },
];

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") redirect("/login");

  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar navItems={navItems} role="OWNER" />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
