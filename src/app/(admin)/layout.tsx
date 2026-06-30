import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" as const },
  { href: "/admin/restaurants", label: "Restaurants", icon: "restaurants" as const },
  { href: "/admin/users", label: "Users", icon: "users" as const },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#FAFAF8]">
      <Sidebar navItems={navItems} role="ADMIN" />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-6xl mx-auto px-8 py-10">{children}</div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
