import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

// Define admin-only routes
const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/reports(.*)",
  "/activity-log(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // If public route, let them pass
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Retrieve user auth state
  const authObj = await auth();
  const { userId, sessionClaims } = authObj;

  // If not logged in, redirect to login
  if (!userId) {
    const loginUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Get user role from Clerk session publicMetadata
  const metadata = sessionClaims?.publicMetadata as { role?: string } | undefined;
  const role = metadata?.role;

  // Protect admin-only routes
  if (isAdminRoute(req)) {
    if (role !== "ADMIN") {
      // Redirect unauthorized users to their dashboard
      const dashboardUrl = new URL("/dashboard", req.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.[^?]*$).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
