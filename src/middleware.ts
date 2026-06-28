import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
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
  const { userId } = authObj;

  // If not logged in, redirect to login
  if (!userId) {
    const loginUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin-only routes: Only allow nmctadmin@gmail.com
  if (isAdminRoute(req)) {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    if (email !== "nmctadmin@gmail.com") {
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
