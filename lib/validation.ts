const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;

interface SanitizeTextOptions {
  maxLength?: number;
  allowNewLines?: boolean;
}

export function sanitizeText(value: unknown, options: SanitizeTextOptions = {}): string | null {
  if (typeof value !== "string") return null;

  const maxLength = options.maxLength ?? 255;
  const allowNewLines = options.allowNewLines ?? false;

  let output = value.normalize("NFKC").replace(CONTROL_CHARS_REGEX, "");
  output = allowNewLines
    ? output.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    : output.replace(/[\r\n\t]+/g, " ");
  output = output.replace(/[<>]/g, "").trim();

  if (!output) return null;
  if (output.length > maxLength) {
    output = output.slice(0, maxLength).trim();
  }
  return output || null;
}

export function sanitizeRequiredText(
  value: unknown,
  maxLength = 255,
  allowNewLines = false
): string | null {
  return sanitizeText(value, { maxLength, allowNewLines });
}

export function sanitizeStringArray(
  value: unknown,
  maxItems = 20,
  maxLength = 80
): string[] {
  if (!Array.isArray(value)) return [];

  const output: string[] = [];
  for (const entry of value) {
    const clean = sanitizeText(entry, { maxLength });
    if (!clean || output.includes(clean)) continue;
    output.push(clean);
    if (output.length >= maxItems) break;
  }
  return output;
}

export function sanitizeEmail(value: unknown): string | null {
  const clean = sanitizeText(value, { maxLength: 254 });
  if (!clean) return null;

  const email = clean.toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email) ? email : null;
}

export function sanitizePhone(value: unknown): string | null {
  const clean = sanitizeText(value, { maxLength: 32 });
  if (!clean) return null;

  const normalized = clean.replace(/[^\d+()\-\s]/g, "").trim();
  if (!normalized) return null;

  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return normalized;
}

export function sanitizeHttpUrl(value: unknown, maxLength = 2048): string | null {
  const clean = sanitizeText(value, { maxLength });
  if (!clean) return null;

  try {
    const url = new URL(clean);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function sanitizeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return fallback;
}

export function sanitizeFloat(
  value: unknown,
  options: { min?: number; max?: number; fallback?: number } = {}
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return options.fallback ?? 0;

  const min = options.min ?? Number.NEGATIVE_INFINITY;
  const max = options.max ?? Number.POSITIVE_INFINITY;
  return Math.min(max, Math.max(min, parsed));
}

export function sanitizeInt(
  value: unknown,
  options: { min?: number; max?: number; fallback?: number } = {}
): number {
  const rounded = Math.floor(sanitizeFloat(value, options));
  const min = options.min ?? Number.NEGATIVE_INFINITY;
  const max = options.max ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(rounded)) return options.fallback ?? 0;
  return Math.min(max, Math.max(min, rounded));
}

export function sanitizeDate(value: unknown): Date | null {
  if (!value) return null;
  const source = typeof value === "string" ? value : String(value);
  const parsed = new Date(source);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed;
}

export function sanitizeEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fallback: T
): T {
  if (typeof value !== "string") return fallback;
  const match = allowedValues.find((entry) => entry === value);
  return match ?? fallback;
}

export async function readJsonObject(
  req: Request,
  options: { maxBytes?: number; requireContentType?: boolean } = {}
): Promise<Record<string, unknown> | null> {
  const maxBytes = options.maxBytes ?? 1_000_000;
  const requireContentType = options.requireContentType ?? true;

  const contentType = (req.headers.get("content-type") ?? "").toLowerCase();
  if (requireContentType && !contentType.includes("application/json")) return null;

  const rawLength = req.headers.get("content-length");
  if (rawLength) {
    const parsedLength = Number(rawLength);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) return null;
  }

  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}
