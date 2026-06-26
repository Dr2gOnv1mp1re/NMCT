/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";

export function createRouteMatcher(routes: string[]) {
  return (req: any) => {
    const url = new URL(req.url);
    return routes.some((route) => {
      const pattern = route.replace(/\(\.\*\)/g, "");
      return url.pathname.startsWith(pattern);
    });
  };
}

export function clerkMiddleware(
  handler: (auth: any, req: any) => Promise<any> | any,
) {
  return async (req: any) => {
    const auth = async () => {
      const sessionCookie = req.cookies.get("mock-session-email")?.value;
      const roleCookie = req.cookies.get("mock-session-role")?.value;
      const userId = sessionCookie
        ? `mock_user_${sessionCookie.replace(/[^a-zA-Z0-9]/g, "")}`
        : null;

      return {
        userId,
        sessionClaims: userId
          ? {
              publicMetadata: {
                role: roleCookie || "FIELD_OFFICER",
              },
            }
          : null,
      };
    };
    return await handler(auth, req);
  };
}

export async function currentUser() {
  const cookieStore = await cookies();
  const email = cookieStore.get("mock-session-email")?.value;
  const role = cookieStore.get("mock-session-role")?.value || "FIELD_OFFICER";
  const name = cookieStore.get("mock-session-name")?.value || "Demo User";

  if (!email) return null;

  return {
    id: `mock_user_${email.replace(/[^a-zA-Z0-9]/g, "")}`,
    firstName: name.split(" ")[0] || "Demo",
    lastName: name.split(" ").slice(1).join(" ") || "User",
    emailAddresses: [{ emailAddress: email }],
    publicMetadata: { role },
  };
}
export async function clerkClient() {
  return {
    invitations: {
      createInvitation: async ({
        emailAddress,
        publicMetadata,
      }: {
        emailAddress: string;
        publicMetadata?: any;
      }) => {
        return {
          id: `mock_inv_${Math.random().toString(36).substring(7)}`,
          emailAddress,
          publicMetadata,
        };
      },
    },
  };
}
