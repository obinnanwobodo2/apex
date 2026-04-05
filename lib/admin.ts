import { auth, currentUser } from "@clerk/nextjs/server";

const LEGACY_ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

const LEGACY_ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean);

const OWNER_USER_ID = (process.env.OWNER_USER_ID ?? "").trim();
const OWNER_EMAIL = (process.env.OWNER_EMAIL ?? "").trim().toLowerCase();

export async function getAdminAccess() {
  const { userId } = await auth();
  if (!userId) return { userId: null, isAdmin: false, isOwner: false };

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";

  // Single-owner enforcement:
  // 1) Preferred: OWNER_USER_ID / OWNER_EMAIL
  // 2) Legacy fallback: first ADMIN_USER_IDS / ADMIN_EMAILS value only
  const resolvedOwnerUserId = OWNER_USER_ID || LEGACY_ADMIN_USER_IDS[0] || "";
  const resolvedOwnerEmail = OWNER_EMAIL || LEGACY_ADMIN_EMAILS[0] || "";
  const ownerConfigured = Boolean(resolvedOwnerUserId || resolvedOwnerEmail);

  const isOwner =
    (resolvedOwnerUserId ? userId === resolvedOwnerUserId : false) ||
    (resolvedOwnerEmail ? email === resolvedOwnerEmail : false);

  // If no owner account is configured, deny admin access by default.
  if (!ownerConfigured) return { userId, isAdmin: false, isOwner: false };

  return { userId, isAdmin: isOwner, isOwner };
}
