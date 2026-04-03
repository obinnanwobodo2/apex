import { auth, currentUser } from "@clerk/nextjs/server";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean);

export async function getAdminAccess() {
  const { userId } = await auth();
  if (!userId) return { userId: null, isAdmin: false };

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";

  const byId = ADMIN_USER_IDS.includes(userId);
  const byEmail = email ? ADMIN_EMAILS.includes(email) : false;
  const allowDevFallback =
    process.env.NODE_ENV === "development" &&
    process.env.ALLOW_ADMIN_DEV_FALLBACK === "true" &&
    ADMIN_USER_IDS.length === 0 &&
    ADMIN_EMAILS.length === 0;

  return { userId, isAdmin: byId || byEmail || allowDevFallback };
}
