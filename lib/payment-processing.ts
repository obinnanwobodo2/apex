import { prisma } from "@/lib/prisma";
import { ALL_PACKAGES, type AnyPackageId } from "@/lib/utils";
import {
  extractDomainFromSubscription,
  registerDomainWithProvider,
  serializeDomainMeta,
  parseDomainMeta,
} from "@/lib/domain-service";

interface PaymentProcessResult {
  success: boolean;
  packageName: string;
  warning?: string;
  domain?: string;
}

function isDomainOrder(sub: { package: string; projectType: string | null }) {
  return sub.projectType === "domain_registration" || sub.package === "domain-registration";
}

async function createSupportTicketIfMissing(userId: string, subject: string, message: string, priority: "normal" | "high" = "normal") {
  const existing = await prisma.supportTicket.findFirst({
    where: {
      userId,
      subject,
      status: { in: ["open", "in_progress"] },
    },
  });
  if (existing) return existing;

  return prisma.supportTicket.create({
    data: {
      userId,
      subject,
      message,
      priority,
      status: "open",
    },
  });
}

async function ensureWebsiteProjectForSubscription(sub: {
  id: string;
  userId: string;
  package: string;
  description: string | null;
}) {
  const pkgId = sub.package as AnyPackageId;
  if (!["starter", "growth", "pro"].includes(pkgId)) return;

  const pendingRequest = await prisma.project.findFirst({
    where: {
      userId: sub.userId,
      type: "request",
      subscriptionId: null,
    },
    orderBy: { createdAt: "desc" },
  });

  const existing = await prisma.project.findFirst({
    where: { userId: sub.userId, subscriptionId: sub.id },
  });

  if (pendingRequest) {
    await prisma.project.update({
      where: { id: pendingRequest.id },
      data: {
        subscriptionId: sub.id,
        type: "website",
        status: "requested",
        progress: 0,
        title: pendingRequest.title || `${ALL_PACKAGES[pkgId]?.name ?? pkgId} Website`,
        description: pendingRequest.description ?? sub.description,
        notes: pendingRequest.notes ?? null,
      },
    });
    return;
  }

  if (!existing) {
    await prisma.project.create({
      data: {
        userId: sub.userId,
        subscriptionId: sub.id,
        title: `${ALL_PACKAGES[pkgId]?.name ?? pkgId} Website`,
        type: "website",
        status: "requested",
        progress: 0,
        description: sub.description ?? null,
      },
    });
  }
}

async function finalizeDomainOrder(sub: {
  id: string;
  userId: string;
  package: string;
  projectType: string | null;
  contactPerson: string | null;
  phone: string | null;
  businessName: string | null;
  description: string | null;
  features: string | null;
}) {
  const domain = extractDomainFromSubscription(sub);
  if (!domain) {
    const warning = "Payment received, but domain value is missing. Admin team has been notified.";
    await createSupportTicketIfMissing(
      sub.userId,
      `Domain registration pending: Missing domain value`,
      `A paid domain order (${sub.id}) could not be provisioned because no valid domain value was stored.`,
      "high"
    );
    return { packageName: "Domain Registration", warning };
  }

  const meta = parseDomainMeta(sub.features);
  const alreadyRegistered = String(meta.registrationStatus ?? "") === "registered";
  if (alreadyRegistered) {
    return { packageName: `${domain} Domain`, domain };
  }

  const yearsRaw = Number(meta.years);
  const years = Number.isFinite(yearsRaw) && yearsRaw > 0 ? Math.min(10, Math.floor(yearsRaw)) : 1;

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      features: serializeDomainMeta(sub.features, {
        registrationStatus: "registering_with_provider",
      }),
    },
  });

  const profile = await prisma.profile.findUnique({
    where: { id: sub.userId },
    select: { fullName: true, companyName: true, phone: true },
  });

  const registration = await registerDomainWithProvider({
    domain,
    years,
    userId: sub.userId,
    email: typeof meta.purchaserEmail === "string" && meta.purchaserEmail.trim()
      ? meta.purchaserEmail.trim()
      : `${sub.userId}@apexvisual.local`,
    fullName: sub.contactPerson ?? profile?.fullName ?? null,
    phone: sub.phone ?? profile?.phone ?? null,
    companyName: profile?.companyName ?? null,
  });

  if (registration.success) {
    const nextBilling = new Date();
    nextBilling.setFullYear(nextBilling.getFullYear() + years);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "active",
        paid: true,
        nextBillingDate: nextBilling,
        features: serializeDomainMeta(sub.features, {
          registrationStatus: "registered",
          providerReference: registration.reference ?? null,
          domain,
          years,
        }),
      },
    });

    await createSupportTicketIfMissing(
      sub.userId,
      `Domain registered: ${domain}`,
      `Your domain ${domain} has been registered successfully.${registration.reference ? ` Provider reference: ${registration.reference}.` : ""}`
    );

    return { packageName: `${domain} Domain`, domain };
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: "pending",
      paid: true,
      nextBillingDate: null,
      features: serializeDomainMeta(sub.features, {
        registrationStatus: "paid_pending_manual_registration",
        registrationError: registration.message ?? "Registrar provisioning failed",
        domain,
        years,
      }),
    },
  });

  const warning = "Payment received. Domain registration is pending manual provisioning by admin.";
  await createSupportTicketIfMissing(
    sub.userId,
    `Manual domain provisioning required: ${domain}`,
    `Payment succeeded for ${domain} but registrar provisioning failed.\nReason: ${registration.message ?? "Unknown provider error"}\nOrder ID: ${sub.id}`,
    "high"
  );

  return { packageName: `${domain} Domain`, warning, domain };
}

export async function processSuccessfulPayment(reference: string): Promise<PaymentProcessResult> {
  const sub = await prisma.subscription.findFirst({
    where: { paystackReference: reference },
  });

  if (!sub) {
    return { success: false, packageName: "Unknown" };
  }

  if (isDomainOrder(sub)) {
    const result = await finalizeDomainOrder(sub);
    return { success: true, packageName: result.packageName, warning: result.warning, domain: result.domain };
  }

  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "active", paid: true, nextBillingDate: nextBilling },
  });

  await ensureWebsiteProjectForSubscription(sub);

  const packageName = ALL_PACKAGES[sub.package as AnyPackageId]?.name ?? sub.package;
  return { success: true, packageName };
}
