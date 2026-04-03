import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/security-monitoring";

const isPublicRoute = createRouteMatcher([
  "/",
  "/about(.*)",
  "/services(.*)",
  "/portfolio(.*)",
  "/contact(.*)",
  "/client-dashboard(.*)",
  "/login(.*)",
  "/register(.*)",
  "/checkout(.*)",
  "/success(.*)",
  "/api/health(.*)",
  "/api/paystack/webhook(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/paystack/webhook(.*)"]);
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitRule {
  windowMs: number;
  limit: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

const RATE_LIMIT_STATE = globalThis as unknown as {
  __apexRateLimitBuckets?: Map<string, RateLimitBucket>;
};

function getRateLimitStore() {
  if (!RATE_LIMIT_STATE.__apexRateLimitBuckets) {
    RATE_LIMIT_STATE.__apexRateLimitBuckets = new Map<string, RateLimitBucket>();
  }
  return RATE_LIMIT_STATE.__apexRateLimitBuckets;
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

function normalizeOrigin(origin: string | null) {
  if (!origin) return null;
  return origin.replace(/\/+$/, "");
}

function getExpectedOrigins(req: Request) {
  const expected = new Set<string>();

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (host) {
    expected.add(`${proto}://${host}`.replace(/\/+$/, ""));
    expected.add(`http://${host}`.replace(/\/+$/, ""));
    expected.add(`https://${host}`.replace(/\/+$/, ""));
  }

  const appUrl = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL ?? null);
  if (appUrl) expected.add(appUrl);

  return expected;
}

function hasTrustedOrigin(req: Request) {
  const incoming = normalizeOrigin(req.headers.get("origin"));
  if (!incoming) return true;
  return getExpectedOrigins(req).has(incoming);
}

function getRateLimitRule(pathname: string, method: string): RateLimitRule {
  if (pathname.startsWith("/api/paystack/initialize")) return { windowMs: 60_000, limit: 10 };
  if (pathname.startsWith("/api/paystack/verify")) return { windowMs: 60_000, limit: 20 };
  if (method !== "GET" && pathname.startsWith("/api/projects/request")) return { windowMs: 60_000, limit: 12 };
  if (method !== "GET" && pathname.startsWith("/api/support")) return { windowMs: 60_000, limit: 12 };
  if (method !== "GET" && pathname.startsWith("/api/subscription/pending")) return { windowMs: 60_000, limit: 12 };
  if (pathname.startsWith("/api/files") && method === "POST") return { windowMs: 60_000, limit: 20 };
  if (pathname.startsWith("/api/domains/check")) return { windowMs: 60_000, limit: 30 };
  if (pathname.startsWith("/api/domains/register")) return { windowMs: 60_000, limit: 10 };
  if (pathname.startsWith("/api/crm/ai")) return { windowMs: 60_000, limit: 20 };
  return { windowMs: 60_000, limit: 120 };
}

function applyRateLimit(rule: RateLimitRule, key: string): RateLimitResult {
  const store = getRateLimitStore();
  const now = Date.now();

  const existing = store.get(key);
  const active = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + rule.windowMs };

  active.count += 1;
  store.set(key, active);

  const allowed = active.count <= rule.limit;
  const remaining = Math.max(rule.limit - active.count, 0);

  // Opportunistic cleanup to avoid unbounded growth.
  if (store.size > 5000) {
    store.forEach((value, bucketKey) => {
      if (value.resetAt <= now) store.delete(bucketKey);
    });
  }

  return {
    allowed,
    remaining,
    limit: rule.limit,
    resetAt: active.resetAt,
  };
}

function withRateHeaders(res: NextResponse, result: RateLimitResult) {
  res.headers.set("X-RateLimit-Limit", String(result.limit));
  res.headers.set("X-RateLimit-Remaining", String(result.remaining));
  res.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
}

function hasValidBasicAuth(
  authHeader: string | null,
  expectedUsername: string,
  expectedPassword: string
) {
  if (!authHeader?.startsWith("Basic ")) return false;
  const token = authHeader.slice(6).trim();
  if (!token) return false;

  try {
    const decoded = atob(token);
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex <= 0) return false;
    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    return username === expectedUsername && password === expectedPassword;
  } catch {
    return false;
  }
}

export default clerkMiddleware(async (auth, req) => {
  const requestId = crypto.randomUUID();
  const isApi = isApiRoute(req);
  const isWebhook = isWebhookRoute(req);

  let rateLimitResult: RateLimitResult | null = null;
  if (isApi && !req.nextUrl.pathname.startsWith("/api/health")) {
    const rule = getRateLimitRule(req.nextUrl.pathname, req.method);
    const ip = getClientIp(req);
    const bucketKey = `${req.method}:${req.nextUrl.pathname}:${ip}`;
    rateLimitResult = applyRateLimit(rule, bucketKey);

    if (!rateLimitResult.allowed) {
      void logSecurityEvent({
        event: "rate_limit_blocked",
        severity: "warn",
        details: {
          path: req.nextUrl.pathname,
          method: req.method,
          ip,
          requestId,
          limit: rateLimitResult.limit,
        },
      });

      const limited = NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
      limited.headers.set("X-Request-Id", requestId);
      withRateHeaders(limited, rateLimitResult);
      return limited;
    }
  }

  if (isApi && MUTATING_METHODS.has(req.method) && !isWebhook) {
    const fetchSite = req.headers.get("sec-fetch-site");
    const crossSite = fetchSite === "cross-site";
    const trustedOrigin = hasTrustedOrigin(req);
    if (crossSite || !trustedOrigin) {
      void logSecurityEvent({
        event: "csrf_blocked",
        severity: "warn",
        details: {
          path: req.nextUrl.pathname,
          method: req.method,
          origin: req.headers.get("origin"),
          fetchSite,
          ip: getClientIp(req),
          requestId,
        },
      });

      const blocked = NextResponse.json({ error: "Request blocked by origin policy." }, { status: 403 });
      blocked.headers.set("X-Request-Id", requestId);
      if (rateLimitResult) withRateHeaders(blocked, rateLimitResult);
      return blocked;
    }
  }

  if (!isPublicRoute(req)) {
    const { userId } = auth();
    if (!userId) {
      const signInUrl = new URL("/login", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  if (isAdminRoute(req)) {
    const adminUser = process.env.ADMIN_BASIC_USERNAME?.trim();
    const adminPass = process.env.ADMIN_BASIC_PASSWORD?.trim();

    if (adminUser && adminPass) {
      const valid = hasValidBasicAuth(req.headers.get("authorization"), adminUser, adminPass);
      if (!valid) {
        void logSecurityEvent({
          event: "admin_basic_auth_failed",
          severity: "warn",
          details: {
            path: req.nextUrl.pathname,
            ip: getClientIp(req),
            requestId,
          },
        });

        return new NextResponse("Admin authorization required", {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="Apex Admin", charset="UTF-8"',
            "X-Request-Id": requestId,
          },
        });
      }
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Request-Id", requestId);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  if (rateLimitResult) {
    withRateHeaders(res, rateLimitResult);
  }
  return res;
});

export const config = {
  matcher: [
    // Ignore all static assets and Next internals, run on app routes and APIs.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|webp|svg|ico|woff2?|ttf|map|json)).*)",
    "/(api|trpc)(.*)",
  ],
};
