export function isTestPaymentModeEnabled() {
  const enabled = (process.env.ENABLE_TEST_PAYMENTS ?? "").trim().toLowerCase() === "true";
  if (!enabled) return false;

  const runtimeMode = (process.env.VERCEL_ENV || process.env.NODE_ENV || "development")
    .trim()
    .toLowerCase();

  // Never allow payment bypass in production.
  return runtimeMode !== "production";
}

