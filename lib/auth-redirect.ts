export function getSafeRedirectPath(raw: unknown, fallback = "/dashboard") {
  const source =
    typeof raw === "string"
      ? raw
      : Array.isArray(raw) && typeof raw[0] === "string"
        ? raw[0]
        : "";
  if (!source) return fallback;

  const value = source.trim();
  if (!value) return fallback;
  if (value.length > 600) return fallback;
  if (value.startsWith("//")) return fallback;

  try {
    const parsed = value.startsWith("/")
      ? new URL(value, "http://localhost")
      : new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
