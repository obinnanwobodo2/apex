export function getSafeRedirectPath(raw: unknown, fallback = "/dashboard") {
  if (typeof raw !== "string") return fallback;

  const value = raw.trim();
  if (!value) return fallback;
  if (value.length > 600) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;

  try {
    const parsed = new URL(value, "http://localhost");
    if (parsed.origin !== "http://localhost") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
