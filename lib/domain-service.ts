export const DOMAIN_PRICES_ZAR: Record<string, number> = {
  "co.za": 180,
  com: 280,
  net: 290,
  org: 260,
  io: 620,
  dev: 350,
};

const RDAP_BOOTSTRAP = "https://data.iana.org/rdap/dns.json";
const FALLBACK_RDAP: Record<string, string> = {
  "co.za": "https://rdap.registry.net.za/",
  com: "https://rdap.verisign.com/com/v1/",
  net: "https://rdap.verisign.com/net/v1/",
  org: "https://rdap.publicinterestregistry.org/rdap/",
  io: "https://rdap.nic.io/",
  dev: "https://rdap.nic.google/",
};

const AVAILABLE_TEXT = new Set(["available", "avail", "free", "ok", "open"]);
const TAKEN_TEXT = new Set(["taken", "registered", "unavailable", "reserved", "premium"]);

export type DomainCheckSource = "registrar" | "rdap";

export interface DomainAvailabilityResult {
  domain: string;
  available: boolean;
  registered: boolean;
  source: DomainCheckSource;
  checkedAt: string;
  error?: string;
  warning?: string;
}

export interface DomainRegistrationResult {
  success: boolean;
  reference?: string | null;
  message?: string;
}

interface DomainProviderPayload {
  domain: string;
  years: number;
  userId: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  companyName?: string | null;
}

function readNestedValue(source: unknown, path: string[]): unknown {
  let cursor: unknown = source;
  for (const key of path) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function parseAvailability(raw: unknown): boolean | null {
  const booleanPaths = [
    ["available"],
    ["isAvailable"],
    ["data", "available"],
    ["result", "available"],
    ["domain", "available"],
    ["DomainInfo", "available"],
  ];

  for (const path of booleanPaths) {
    const value = readNestedValue(raw, path);
    if (typeof value === "boolean") return value;
  }

  const stringPaths = [
    ["status"],
    ["availability"],
    ["data", "status"],
    ["result", "status"],
    ["data", "availability"],
    ["DomainInfo", "domainAvailability"],
    ["domainAvailability"],
  ];

  for (const path of stringPaths) {
    const value = readNestedValue(raw, path);
    if (typeof value !== "string") continue;
    const normalized = normalizeToken(value);
    if (AVAILABLE_TEXT.has(normalized)) return true;
    if (TAKEN_TEXT.has(normalized)) return false;
    if (normalized === "undetermined" || normalized === "unknown") return null;
  }

  return null;
}

function safeJsonParse<T = Record<string, unknown>>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function domainRegex(domain: string) {
  return /^(?=.{3,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain);
}

export function normalizeDomain(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  const noProtocol = trimmed.replace(/^https?:\/\//, "");
  const noPath = noProtocol.split("/")[0];
  const noPort = noPath.split(":")[0];
  const domain = noPort.replace(/^www\./, "").replace(/\.+$/, "");
  if (!domainRegex(domain)) return null;
  return domain;
}

export function getDomainTld(domain: string): string {
  return domain.split(".").slice(1).join(".");
}

export function isSupportedDomain(domain: string): boolean {
  const tld = getDomainTld(domain);
  return tld in DOMAIN_PRICES_ZAR;
}

export function getDomainPrice(domain: string): number | null {
  const tld = getDomainTld(domain);
  return DOMAIN_PRICES_ZAR[tld] ?? null;
}

export function formatDomainPrice(domain: string): string {
  const price = getDomainPrice(domain);
  return price ? `R${price}/yr` : "Contact us";
}

export function generateDomainSuggestions(domain: string): string[] {
  const normalized = normalizeDomain(domain);
  if (!normalized) return [];

  const [name] = normalized.split(".");
  const tld = getDomainTld(normalized);
  const alternatives = tld === "co.za" ? ["com", "net", "org", "io"] : ["co.za", "com", "net", "io"];
  return [
    ...alternatives.map((alt) => `${name}.${alt}`),
    `get${name}.${tld}`,
    `${name}hq.${tld}`,
    `${name}online.${tld}`,
  ]
    .filter((value) => value !== normalized)
    .slice(0, 6);
}

async function getRdapUrl(tld: string): Promise<string | null> {
  try {
    if (FALLBACK_RDAP[tld]) return FALLBACK_RDAP[tld];
    const res = await fetch(RDAP_BOOTSTRAP, { next: { revalidate: 86400 } });
    const data = await res.json();
    for (const [tlds, urls] of data.services ?? []) {
      if (Array.isArray(tlds) && Array.isArray(urls) && tlds.includes(tld) && urls.length > 0) {
        return urls[0];
      }
    }
  } catch {
    // Ignore bootstrap fetch issues and continue with fallback.
  }
  return null;
}

async function checkDomainViaRdap(domain: string): Promise<DomainAvailabilityResult> {
  const tld = getDomainTld(domain);
  const rdapBase = await getRdapUrl(tld);

  if (!rdapBase) {
    return {
      domain,
      available: false,
      registered: false,
      source: "rdap",
      checkedAt: new Date().toISOString(),
      error: "TLD not supported by RDAP",
    };
  }

  try {
    const url = `${rdapBase}domain/${encodeURIComponent(domain)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });

    if (res.status === 404) {
      return { domain, available: true, registered: false, source: "rdap", checkedAt: new Date().toISOString() };
    }
    if (res.status === 200) {
      return { domain, available: false, registered: true, source: "rdap", checkedAt: new Date().toISOString() };
    }
    return {
      domain,
      available: false,
      registered: false,
      source: "rdap",
      checkedAt: new Date().toISOString(),
      error: `RDAP returned HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      domain,
      available: false,
      registered: false,
      source: "rdap",
      checkedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : "RDAP lookup failed",
    };
  }
}

async function checkDomainViaProvider(domain: string): Promise<DomainAvailabilityResult> {
  const checkUrl = process.env.DOMAIN_PROVIDER_CHECK_URL?.trim();
  if (!checkUrl) {
    return {
      domain,
      available: false,
      registered: false,
      source: "registrar",
      checkedAt: new Date().toISOString(),
      error: "Registrar check endpoint not configured",
    };
  }

  const key = process.env.DOMAIN_PROVIDER_API_KEY?.trim();
  const method = (process.env.DOMAIN_PROVIDER_CHECK_METHOD || "GET").toUpperCase();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (key) headers.Authorization = `Bearer ${key}`;
  if (method !== "GET") headers["Content-Type"] = "application/json";

  const url = checkUrl.includes("{domain}")
    ? checkUrl.replace(/\{domain\}/g, encodeURIComponent(domain))
    : `${checkUrl}${checkUrl.includes("?") ? "&" : "?"}domain=${encodeURIComponent(domain)}`;

  const res = await fetch(url, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify({ domain }),
    cache: "no-store",
    signal: AbortSignal.timeout(9000),
  });

  const rawText = await res.text();
  const payload = safeJsonParse(rawText) ?? { raw: rawText };
  if (!res.ok) {
    throw new Error(`Registrar availability check failed (HTTP ${res.status})`);
  }

  const available = parseAvailability(payload);
  if (available === null) {
    throw new Error("Registrar response did not include a clear availability status");
  }

  return {
    domain,
    available,
    registered: !available,
    source: "registrar",
    checkedAt: new Date().toISOString(),
  };
}

export async function checkDomainAvailability(domain: string): Promise<DomainAvailabilityResult> {
  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedDomain) {
    return {
      domain: domain.trim().toLowerCase(),
      available: false,
      registered: false,
      source: "rdap",
      checkedAt: new Date().toISOString(),
      error: "Invalid domain format",
    };
  }

  let providerError: string | null = null;
  if (process.env.DOMAIN_PROVIDER_CHECK_URL) {
    try {
      return await checkDomainViaProvider(normalizedDomain);
    } catch (err) {
      providerError = err instanceof Error ? err.message : "Registrar check failed";
    }
  }

  const rdapResult = await checkDomainViaRdap(normalizedDomain);
  if (providerError && !rdapResult.error) {
    return {
      ...rdapResult,
      warning: `Registrar lookup unavailable: ${providerError}. RDAP fallback used.`,
    };
  }
  if (providerError && rdapResult.error) {
    return {
      ...rdapResult,
      error: `${rdapResult.error}. Registrar lookup also failed: ${providerError}`,
    };
  }
  return rdapResult;
}

function parseProviderReference(payload: unknown): string | null {
  const candidates = [
    ["reference"],
    ["id"],
    ["orderId"],
    ["order_id"],
    ["data", "reference"],
    ["data", "id"],
    ["result", "reference"],
    ["result", "id"],
  ];
  for (const path of candidates) {
    const value = readNestedValue(payload, path);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export async function registerDomainWithProvider(input: DomainProviderPayload): Promise<DomainRegistrationResult> {
  const registerUrl = process.env.DOMAIN_PROVIDER_REGISTER_URL?.trim();
  if (!registerUrl) {
    return { success: false, message: "Registrar registration endpoint is not configured" };
  }

  const key = process.env.DOMAIN_PROVIDER_API_KEY?.trim();
  const method = (process.env.DOMAIN_PROVIDER_REGISTER_METHOD || "POST").toUpperCase();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (key) headers.Authorization = `Bearer ${key}`;
  if (method !== "GET") headers["Content-Type"] = "application/json";

  const url = registerUrl.includes("{domain}")
    ? registerUrl.replace(/\{domain\}/g, encodeURIComponent(input.domain))
    : registerUrl;

  const payload = {
    domain: input.domain,
    years: input.years,
    userId: input.userId,
    customer: {
      email: input.email,
      fullName: input.fullName ?? "",
      phone: input.phone ?? "",
      companyName: input.companyName ?? "",
    },
  };

  const res = await fetch(url, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });

  const rawText = await res.text();
  const body = safeJsonParse(rawText) ?? { raw: rawText };

  if (!res.ok) {
    return {
      success: false,
      message: `Registrar registration failed (HTTP ${res.status})`,
      reference: parseProviderReference(body),
    };
  }

  const explicitSuccess = readNestedValue(body, ["success"]);
  if (explicitSuccess === false) {
    return {
      success: false,
      reference: parseProviderReference(body),
      message: typeof readNestedValue(body, ["message"]) === "string"
        ? String(readNestedValue(body, ["message"]))
        : "Registrar rejected domain registration",
    };
  }

  return {
    success: true,
    reference: parseProviderReference(body),
    message: typeof readNestedValue(body, ["message"]) === "string" ? String(readNestedValue(body, ["message"])) : undefined,
  };
}

export function buildDomainPurchaseMeta(params: {
  domain: string;
  years: number;
  source: DomainCheckSource;
  price: number;
  totalPrice: number;
  purchaserEmail?: string;
}) {
  return JSON.stringify({
    domain: params.domain,
    years: params.years,
    source: params.source,
    basePrice: params.price,
    totalPrice: params.totalPrice,
    purchaserEmail: params.purchaserEmail ?? "",
    registrationStatus: "awaiting_payment",
    providerReference: null,
    updatedAt: new Date().toISOString(),
  });
}

export function parseDomainMeta(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function serializeDomainMeta(currentRaw: string | null | undefined, updates: Record<string, unknown>) {
  const current = parseDomainMeta(currentRaw);
  return JSON.stringify({
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export function extractDomainFromSubscription(subscription: {
  businessName: string | null;
  description: string | null;
  features: string | null;
}) {
  const businessDomain = normalizeDomain(subscription.businessName ?? "");
  if (businessDomain) return businessDomain;

  const metaDomain = normalizeDomain(String(parseDomainMeta(subscription.features).domain ?? ""));
  if (metaDomain) return metaDomain;

  const text = `${subscription.description ?? ""}`;
  const maybeMatch = text.match(/([a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+)/i)?.[1] ?? "";
  return normalizeDomain(maybeMatch);
}
