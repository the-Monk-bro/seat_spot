import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] p-4 relative overflow-hidden">
      {/* Subtle decorative orbs */}
      <div className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-primary/6 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-[350px] w-[350px] rounded-full bg-accent/40 blur-[90px]" />
      <div className="relative z-10 w-full">
        {children}
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
