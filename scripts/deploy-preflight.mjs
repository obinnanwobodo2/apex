#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const runtimeMode = (process.env.VERCEL_ENV || process.env.NODE_ENV || "development").trim().toLowerCase();
const isProduction = runtimeMode === "production";

if (process.env.SKIP_DEPLOY_CHECK === "true") {
  console.log("[deploy-check] Skipped because SKIP_DEPLOY_CHECK=true");
  process.exit(0);
}

hydrateEnvFromFiles(runtimeMode);

const errors = [];
const warnings = [];

function hydrateEnvFromFiles(mode) {
  const files = [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`];

  for (const file of files) {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const parsed = parseEnv(content);
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function parseEnv(content) {
  const result = {};
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }
  return result;
}

function getEnv(name) {
  return (process.env[name] || "").trim();
}

function hasEnv(name) {
  return getEnv(name).length > 0;
}

function addIssue(message) {
  if (isProduction) errors.push(message);
  else warnings.push(message);
}

function requireEnv(name) {
  if (!hasEnv(name)) addIssue(`Missing required env var: ${name}`);
}

function requireOneOf(names) {
  if (!names.some((name) => hasEnv(name))) {
    addIssue(`At least one env var is required: ${names.join(" or ")}`);
  }
}

function warnIfMissing(name, message) {
  if (!hasEnv(name)) warnings.push(message);
}

function validateUrl(name, { httpsOnly = false, allowLocalHttp = false } = {}) {
  const value = getEnv(name);
  if (!value) return;

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    addIssue(`${name} must be a valid URL`);
    return;
  }

  if (httpsOnly && parsed.protocol !== "https:") {
    const localHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (!(allowLocalHttp && localHost && parsed.protocol === "http:")) {
      addIssue(`${name} must use https in production`);
    }
  }

  if (value.endsWith("/")) {
    warnings.push(`${name} has a trailing slash. Prefer no trailing slash.`);
  }
}

function validateKeyPrefix(name, disallowedPrefixes) {
  const value = getEnv(name);
  if (!value) return;
  for (const prefix of disallowedPrefixes) {
    if (value.startsWith(prefix)) {
      addIssue(`${name} appears to be a non-production key (${prefix}...)`);
      return;
    }
  }
}

function validateDatabaseUrl() {
  const value = getEnv("DATABASE_URL");
  if (!value) return;

  if (value.startsWith("file:")) {
    addIssue("DATABASE_URL points to SQLite. Use PostgreSQL in production.");
    return;
  }

  if (!/^postgres(ql)?:\/\//i.test(value)) {
    addIssue("DATABASE_URL must be a PostgreSQL connection string.");
  }

  if (isProduction && /localhost|127\.0\.0\.1/i.test(value)) {
    addIssue("DATABASE_URL must not point to localhost in production.");
  }

  if (isProduction && !/sslmode=require/i.test(value)) {
    warnings.push("DATABASE_URL should include sslmode=require in production.");
  }
}

function validateDirectDatabaseUrl() {
  const value = getEnv("DIRECT_URL");
  if (!value) return;

  if (value.startsWith("file:")) {
    addIssue("DIRECT_URL points to SQLite. Use PostgreSQL for migrations.");
    return;
  }

  if (!/^postgres(ql)?:\/\//i.test(value)) {
    addIssue("DIRECT_URL must be a PostgreSQL connection string.");
  }

  if (isProduction && /localhost|127\.0\.0\.1/i.test(value)) {
    addIssue("DIRECT_URL must not point to localhost in production.");
  }

  if (isProduction && !/sslmode=require/i.test(value)) {
    warnings.push("DIRECT_URL should include sslmode=require in production.");
  }
}

function validatePooledRuntimeNeedsDirectUrl() {
  const databaseUrl = getEnv("DATABASE_URL").toLowerCase();
  if (!databaseUrl) return;

  const looksPooled =
    databaseUrl.includes("pooler.supabase.com") ||
    databaseUrl.includes("pgbouncer=true") ||
    databaseUrl.includes(":6543/");

  if (looksPooled && !hasEnv("DIRECT_URL")) {
    addIssue("DIRECT_URL is required when DATABASE_URL uses a pooled/pgBouncer connection.");
  }
}

console.log(`[deploy-check] Running preflight for mode: ${runtimeMode}`);

requireEnv("DATABASE_URL");
requireEnv("NEXT_PUBLIC_APP_URL");
requireEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
requireEnv("CLERK_SECRET_KEY");
requireEnv("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY");
requireEnv("PAYSTACK_SECRET_KEY");
requireOneOf(["OWNER_USER_ID", "OWNER_EMAIL", "ADMIN_EMAILS", "ADMIN_USER_IDS"]);

validateDatabaseUrl();
validateDirectDatabaseUrl();
validatePooledRuntimeNeedsDirectUrl();
validateUrl("NEXT_PUBLIC_APP_URL", { httpsOnly: true, allowLocalHttp: true });
validateUrl("SECURITY_ALERT_WEBHOOK_URL", { httpsOnly: true });
validateUrl("APP_ALERT_WEBHOOK_URL", { httpsOnly: true });

if (hasEnv("ALLOWED_CORS_ORIGINS")) {
  const values = getEnv("ALLOWED_CORS_ORIGINS")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  for (const value of values) {
    try {
      const parsed = new URL(value);
      if (isProduction && parsed.protocol !== "https:") {
        addIssue(`ALLOWED_CORS_ORIGINS contains a non-https origin: ${value}`);
      }
    } catch {
      addIssue(`ALLOWED_CORS_ORIGINS has an invalid URL value: ${value}`);
    }
  }
}

if (hasEnv("ADMIN_BASIC_USERNAME") !== hasEnv("ADMIN_BASIC_PASSWORD")) {
  addIssue("ADMIN_BASIC_USERNAME and ADMIN_BASIC_PASSWORD must both be set or both be empty.");
}

if (isProduction && getEnv("ALLOW_ADMIN_DEV_FALLBACK").toLowerCase() === "true") {
  addIssue("ALLOW_ADMIN_DEV_FALLBACK must be false in production.");
}

if (isProduction && getEnv("ENABLE_TEST_PAYMENTS").toLowerCase() === "true") {
  addIssue("ENABLE_TEST_PAYMENTS must be false in production.");
}

validateKeyPrefix("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY", ["pk_test"]);
validateKeyPrefix("PAYSTACK_SECRET_KEY", ["sk_test"]);
validateKeyPrefix("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", ["pk_test"]);
validateKeyPrefix("CLERK_SECRET_KEY", ["sk_test"]);

if (isProduction && hasEnv("ADMIN_EMAILS") && !hasEnv("OWNER_USER_ID") && !hasEnv("OWNER_EMAIL")) {
  warnings.push(
    "OWNER_USER_ID/OWNER_EMAIL is not set. Admin access relies on ADMIN_EMAILS/ADMIN_USER_IDS only."
  );
}

warnIfMissing(
  "SECURITY_ALERT_WEBHOOK_URL",
  "SECURITY_ALERT_WEBHOOK_URL is not set. Security events will only be logged locally."
);
warnIfMissing(
  "APP_ALERT_WEBHOOK_URL",
  "APP_ALERT_WEBHOOK_URL is not set. Application crash alerts will use SECURITY_ALERT_WEBHOOK_URL fallback."
);
warnIfMissing(
  "NEXT_PUBLIC_TERMLY_PRIVACY_POLICY_ID",
  "NEXT_PUBLIC_TERMLY_PRIVACY_POLICY_ID is missing. Privacy page will show fallback static text."
);
warnIfMissing(
  "NEXT_PUBLIC_TERMLY_TERMS_OF_USE_ID",
  "NEXT_PUBLIC_TERMLY_TERMS_OF_USE_ID is missing. Terms page will show fallback static text."
);

if (errors.length) {
  console.error("[deploy-check] Failed:");
  for (const message of errors) console.error(`- ${message}`);
  if (warnings.length) {
    console.warn("[deploy-check] Warnings:");
    for (const message of warnings) console.warn(`- ${message}`);
  }
  process.exit(1);
}

if (warnings.length) {
  console.warn("[deploy-check] Passed with warnings:");
  for (const message of warnings) console.warn(`- ${message}`);
  process.exit(0);
}

console.log("[deploy-check] Passed.");
