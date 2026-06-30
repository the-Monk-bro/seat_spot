import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  const isLoggedIn = !!session;
  const role = session?.user?.role;

  // Protect customer routes
  if (pathname.startsWith("/customer")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  }

  // Protect owner routes
  if (pathname.startsWith("/owner")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "OWNER") {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  }

  // Redirect already-logged-in users away from auth pages
  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    if (role === "OWNER") return NextResponse.redirect(new URL("/owner/dashboard", nextUrl));
    return NextResponse.redirect(new URL("/customer/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/customer/:path*",
    "/owner/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
