import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // If public route, let them pass
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Retrieve user auth state — Edge-safe, reads from JWT only
  const authObj = await auth();
  const { userId } = authObj;

  // If not logged in, redirect to sign-in
  if (!userId) {
    const loginUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Admin email check is intentionally NOT done here.
  // clerkClient().users.getUser() is a Node.js backend call and crashes on
  // Vercel's Edge Runtime. Admin route protection (nmctadmin@gmail.com check)
  // is enforced server-side inside the /admin page using currentUser().

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
