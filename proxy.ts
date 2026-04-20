import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAuthRoute = nextUrl.pathname === "/auth/signin";

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/app/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // /app/* — only protected surface beyond the auth routes.
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/auth/signin"],
};
