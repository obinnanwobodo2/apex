export function isTestPaymentModeEnabled() {
  return (process.env.ENABLE_TEST_PAYMENTS ?? "").trim().toLowerCase() === "true";
}

