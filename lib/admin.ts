import { auth, currentUser } from "@clerk/nextjs/server";

function stripWrappingQuotes(value: string) {
  return value.replace(/^['"]+|['"]+$/g, "");
}

function normalizeCsv(raw: string, { lowerCase = false } = {}) {
  return raw
    .split(",")
    .map((v) => stripWrappingQuotes(v.trim()))
    .filter(Boolean)
    .map((v) => (lowerCase ? v.toLowerCase() : v));
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return stripWrappingQuotes(value.trim()).toLowerCase();
}

const LEGACY_ADMIN_USER_IDS = normalizeCsv(process.env.ADMIN_USER_IDS ?? "");

const LEGACY_ADMIN_EMAILS = normalizeCsv(process.env.ADMIN_EMAILS ?? "", {
  lowerCase: true,
});

const OWNER_USER_ID = stripWrappingQuotes((process.env.OWNER_USER_ID ?? "").trim());
const OWNER_EMAIL = normalizeEmail(process.env.OWNER_EMAIL ?? "");

export async function getAdminAccess() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return { userId: null, isAdmin: false, isOwner: false };

  const hasStrictOwner = Boolean(OWNER_USER_ID || OWNER_EMAIL);
  const allowedUserIds = hasStrictOwner
    ? [OWNER_USER_ID].filter(Boolean)
    : LEGACY_ADMIN_USER_IDS;
  const allowedEmails = hasStrictOwner
    ? [OWNER_EMAIL].filter(Boolean)
    : LEGACY_ADMIN_EMAILS;
  const ownerConfigured = allowedUserIds.length > 0 || allowedEmails.length > 0;

  if (!ownerConfigured) return { userId, isAdmin: false, isOwner: false };
  if (allowedUserIds.includes(userId)) return { userId, isAdmin: true, isOwner: true };

  const emailCandidates = new Set<string>();
  const claims = (sessionClaims ?? {}) as Record<string, unknown>;
  const addCandidate = (candidate: unknown) => {
    const email = normalizeEmail(candidate);
    if (email) emailCandidates.add(email);
  };

  addCandidate(claims.email);
  addCandidate(claims.primary_email);
  addCandidate(claims.email_address);

  // Fallback to Clerk user lookup when claims do not expose email.
  if (allowedEmails.length > 0 && !allowedEmails.some((email) => emailCandidates.has(email))) {
    try {
      const user = await currentUser();
      addCandidate(user?.primaryEmailAddress?.emailAddress);
      for (const emailAddress of user?.emailAddresses ?? []) {
        addCandidate(emailAddress.emailAddress);
      }
    } catch {
      // If Clerk user lookup fails, deny by default.
    }
  }

  const isOwner = allowedEmails.some((email) => emailCandidates.has(email));
  return { userId, isAdmin: isOwner, isOwner };
}
