import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPrefixes = ["/dashboard", "/profile", "/games"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/games/:path*"],
};
