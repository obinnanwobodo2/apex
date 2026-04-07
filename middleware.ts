import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/security-monitoring";
import { isDashboardGuestPreviewEnabled } from "@/lib/dashboard-guest-preview";

const isPublicRoute = createRouteMatcher([
  "/",
  "/_clerk(.*)",
  "/about(.*)",
  "/services(.*)",
  "/pricing(.*)",
  "/portfolio(.*)",
  "/contact(.*)",
  "/client-dashboard(.*)",
  "/login(.*)",
  "/register(.*)",
  "/auth/callback(.*)",
  "/checkout(.*)",
  "/success(.*)",
  "/api/health(.*)",
  "/api/newsletter/subscribe(.*)",
  "/api/paystack/webhook(.*)",
  "/api/monitoring/client-errors(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/paystack/webhook(.*)"]);
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ALLOWED_CORS_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const ALLOWED_CORS_HEADERS = "Content-Type, Authorization, X-Requested-With, X-Request-Id";
const ENABLE_STRICT_CSP = process.env.ENABLE_STRICT_CSP === "true";

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

interface HeaderOptions {
  requestId: string;
  rateLimitResult: RateLimitResult | null;
  applyCors: boolean;
  corsOrigin: string | null;
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

function normalizeHost(host: string | null) {
  if (!host) return "";
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

function getRequestHost(req: Request) {
  return normalizeHost(req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
}

function getCanonicalRedirectUrl(req: Request) {
  if (process.env.NODE_ENV !== "production") return null;

  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!rawAppUrl) return null;

  let canonical: URL;
  try {
    canonical = new URL(rawAppUrl);
  } catch {
    return null;
  }

  const requestHost = getRequestHost(req);
  const canonicalHost = normalizeHost(canonical.host);
  if (!requestHost || !canonicalHost || requestHost === canonicalHost) return null;

  // Keep users on the canonical domain in production; preview hosts can break Clerk auth.
  if (!requestHost.endsWith(".vercel.app")) return null;

  const redirectUrl = new URL(req.url);
  redirectUrl.protocol = canonical.protocol;
  redirectUrl.host = canonicalHost;
  return redirectUrl;
}

function normalizeOrigin(origin: string | null) {
  if (!origin) return null;
  return origin.replace(/\/+$/, "");
}

function appendVary(res: NextResponse, value: string) {
  const existing = res.headers.get("Vary");
  if (!existing) {
    res.headers.set("Vary", value);
    return;
  }
  const values = existing
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (!values.includes(value.toLowerCase())) {
    res.headers.set("Vary", `${existing}, ${value}`);
  }
}

const EXTRA_ALLOWED_ORIGINS = (process.env.ALLOWED_CORS_ORIGINS ?? "")
  .split(",")
  .map((value) => normalizeOrigin(value.trim()))
  .filter((value): value is string => Boolean(value));

function getExpectedOrigins(req: Request) {
  const expected = new Set<string>(EXTRA_ALLOWED_ORIGINS);

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

function getTrustedOrigin(req: Request) {
  const incoming = normalizeOrigin(req.headers.get("origin"));
  if (!incoming) return null;
  return getExpectedOrigins(req).has(incoming) ? incoming : null;
}

function hasTrustedOrigin(req: Request) {
  const incoming = normalizeOrigin(req.headers.get("origin"));
  if (!incoming) return true;
  return Boolean(getTrustedOrigin(req));
}

function getRateLimitRule(pathname: string, method: string): RateLimitRule {
  if (pathname.startsWith("/api/paystack/webhook")) return { windowMs: 60_000, limit: 300 };
  if (pathname.startsWith("/api/paystack/initialize")) return { windowMs: 60_000, limit: 8 };
  if (pathname.startsWith("/api/paystack/verify")) return { windowMs: 60_000, limit: 16 };
  if (pathname.startsWith("/api/admin/ai")) return { windowMs: 60_000, limit: 8 };
  if (pathname.startsWith("/api/crm/ai")) return { windowMs: 60_000, limit: 10 };
  if (pathname.startsWith("/api/monitoring/client-errors")) return { windowMs: 60_000, limit: 30 };
  if (method !== "GET" && pathname.startsWith("/api/projects/request")) return { windowMs: 60_000, limit: 10 };
  if (method !== "GET" && pathname.startsWith("/api/support")) return { windowMs: 60_000, limit: 10 };
  if (method !== "GET" && pathname.startsWith("/api/subscription/pending")) return { windowMs: 60_000, limit: 10 };
  if (pathname.startsWith("/api/files") && method === "POST") return { windowMs: 60_000, limit: 10 };
  if (pathname.startsWith("/api/domains/check")) return { windowMs: 60_000, limit: 20 };
  if (pathname.startsWith("/api/domains/register")) return { windowMs: 60_000, limit: 8 };
  return { windowMs: 60_000, limit: 90 };
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

function buildContentSecurityPolicy() {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "https://js.clerk.com",
    "https://clerk.apexvisual.co.za",
    "https://accounts.apexvisual.co.za",
    "https://checkout.paystack.com",
    "https://app.termly.io",
  ];

  if (process.env.NODE_ENV !== "production") {
    scriptSrc.push("'unsafe-eval'");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.paystack.co https://checkout.paystack.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.apexvisual.co.za https://accounts.apexvisual.co.za",
    "frame-src 'self' https://checkout.paystack.com https://app.termly.io https://*.clerk.com https://*.clerk.accounts.dev https://clerk.apexvisual.co.za https://accounts.apexvisual.co.za",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function applySecurityHeaders(res: NextResponse, options: HeaderOptions) {
  res.headers.set("X-Request-Id", options.requestId);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  // Keep auth/OAuth popup flows compatible.
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.headers.set("Cross-Origin-Resource-Policy", "same-site");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  res.headers.set("Origin-Agent-Cluster", "?1");
  if (process.env.NODE_ENV === "production" && ENABLE_STRICT_CSP) {
    res.headers.set("Content-Security-Policy", buildContentSecurityPolicy());
  }

  if (options.applyCors) {
    appendVary(res, "Origin");
    res.headers.set("Access-Control-Allow-Methods", ALLOWED_CORS_METHODS);
    res.headers.set("Access-Control-Allow-Headers", ALLOWED_CORS_HEADERS);
    res.headers.set("Access-Control-Max-Age", "600");
    if (options.corsOrigin) {
      res.headers.set("Access-Control-Allow-Origin", options.corsOrigin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
    }
  }

  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  if (options.rateLimitResult) {
    withRateHeaders(res, options.rateLimitResult);
  }
}

export default clerkMiddleware(async (auth, req) => {
  const requestId = crypto.randomUUID();
  const isApi = isApiRoute(req);
  const isWebhook = isWebhookRoute(req);
  const corsOrigin = getTrustedOrigin(req);
  const isDashboardGuestRoute =
    !isApi
    && isDashboardGuestPreviewEnabled()
    && req.nextUrl.pathname.startsWith("/dashboard");
  let rateLimitResult: RateLimitResult | null = null;

  function finalize(res: NextResponse) {
    applySecurityHeaders(res, {
      requestId,
      rateLimitResult,
      applyCors: isApi,
      corsOrigin,
    });
    return res;
  }

  if (!isApi) {
    const canonicalRedirectUrl = getCanonicalRedirectUrl(req);
    if (canonicalRedirectUrl) {
      return finalize(NextResponse.redirect(canonicalRedirectUrl, 307));
    }
  }

  if (isApi && req.method === "OPTIONS") {
    if (req.headers.get("origin") && !corsOrigin) {
      void logSecurityEvent({
        event: "cors_preflight_blocked",
        severity: "warn",
        details: {
          path: req.nextUrl.pathname,
          ip: getClientIp(req),
          requestId,
          origin: req.headers.get("origin"),
        },
      });
      return finalize(NextResponse.json({ error: "Request blocked by CORS policy." }, { status: 403 }));
    }
    return finalize(new NextResponse(null, { status: 204 }));
  }

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

      return finalize(
        NextResponse.json(
          { error: "Too many requests. Please try again shortly." },
          { status: 429 }
        )
      );
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

      return finalize(NextResponse.json({ error: "Request blocked by origin policy." }, { status: 403 }));
    }
  }

  if (!isPublicRoute(req) && !isDashboardGuestRoute) {
    const { userId } = auth();
    if (!userId) {
      if (isApi) {
        return finalize(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
      }
      const signInUrl = new URL("/login", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return finalize(NextResponse.redirect(signInUrl));
    }
  }

  if (isAdminRoute(req) && process.env.BYPASS_ADMIN_AUTH !== "true") {
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

        return finalize(
          new NextResponse("Admin authorization required", {
            status: 401,
            headers: {
              "WWW-Authenticate": 'Basic realm="Apex Admin", charset="UTF-8"',
            },
          })
        );
      }
    }
  }

  return finalize(NextResponse.next());
});

export const config = {
  matcher: [
    // Ignore all static assets and Next internals, run on app routes and APIs.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|webp|svg|ico|woff2?|ttf|map|json)).*)",
    "/(api|trpc)(.*)",
  ],
};
