import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/validation";

export async function resolveOwnedContactId(
  userId: string,
  candidate: unknown
): Promise<{ ok: boolean; contactId: string | null }> {
  const raw = sanitizeText(candidate, { maxLength: 64 });
  if (!raw) return { ok: true, contactId: null };

  const contact = await prisma.contact.findFirst({
    where: { id: raw, userId },
    select: { id: true },
  });

  if (!contact) return { ok: false, contactId: null };
  return { ok: true, contactId: contact.id };
}
