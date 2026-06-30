import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SeatSpot — Restaurant Reservations Made Simple",
    template: "%s | SeatSpot",
  },
  description:
    "Discover top restaurants, browse menus, and book your table instantly with SeatSpot — India's restaurant reservation platform.",
  keywords: ["restaurant reservation", "book table", "dining", "restaurants near me"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
