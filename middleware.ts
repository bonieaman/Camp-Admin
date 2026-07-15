import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { canAccessPath, type AdminRole } from "@/lib/rbac";

const COOKIE_NAME = "yc_admin_session";

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

function forbidden() {
  return new NextResponse(
    `<!doctype html><html><head><title>403 - Access Denied</title><style>body{font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;display:grid;min-height:100vh;place-items:center;margin:0}.card{background:white;border:1px solid #e2e8f0;border-radius:16px;padding:32px;box-shadow:0 20px 60px rgba(15,23,42,.12);max-width:420px}h1{margin:0 0 8px;font-size:28px}p{margin:0;color:#475569;font-weight:600}</style></head><body><main class="card"><h1>403 - Access Denied</h1><p>You do not have permission to view this page.</p></main></body></html>`,
    { status: 403, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedPath = pathname.startsWith("/api") || ["/dashboard", "/participants", "/attendance", "/meals", "/teams", "/outreach", "/digital-evangelism", "/certificates", "/settings"].some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (!protectedPath) return NextResponse.next();

  const secret = authSecret();
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!secret || !token) {
    if (pathname.startsWith("/api")) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const result = await jwtVerify(token, secret);
    const role = result.payload.role as AdminRole | undefined;
    if (!role || !canAccessPath(role, pathname)) {
      if (pathname.startsWith("/api")) return NextResponse.json({ ok: false, message: "403 - Access Denied" }, { status: 403 });
      return forbidden();
    }
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api")) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/participants/:path*", "/attendance/:path*", "/meals/:path*", "/teams/:path*", "/outreach/:path*", "/digital-evangelism/:path*", "/certificates/:path*", "/settings/:path*", "/api/:path*"]
};
