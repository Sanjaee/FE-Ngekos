import {
  NextMiddleware,
  NextResponse,
  NextRequest,
  NextFetchEvent,
} from "next/server";
import { getToken } from "next-auth/jwt";

const adminPrefix = "/admin";

export default function withAuth(
  middleware: NextMiddleware,
  requireAuth: string[] = []
) {
  return async (req: NextRequest, next: NextFetchEvent) => {
    const pathname = req.nextUrl.pathname;
    if (requireAuth.some((route) => pathname.startsWith(route))) {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (!token) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      const userRole = token.backendUser?.role;
      if (
        pathname.startsWith(adminPrefix) &&
        userRole !== "owner" &&
        userRole !== "admin" &&
        userRole !== "mod"
      ) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    return middleware(req, next);
  };
}
