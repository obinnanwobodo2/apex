const RAW_FLAG = (process.env.ALLOW_DASHBOARD_GUEST_PREVIEW ?? "true").trim().toLowerCase();

export function isDashboardGuestPreviewEnabled() {
  return !["0", "false", "no", "off"].includes(RAW_FLAG);
}

