import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import withAuth from "@/middlewares/WithAuth";
//middleware
export function mainMiddleware(request: NextRequest) {
  const res = NextResponse.next();
  return res;
}

export default withAuth(mainMiddleware, ["/admin", "/post"]); // UBAH SESUAI ROUTE YANG INGIN DI KUNCI JIKA BELUM LOGIN
