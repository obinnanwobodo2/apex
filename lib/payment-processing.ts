import { prisma } from "@/lib/prisma";
import { ALL_PACKAGES, PACKAGES, type AnyPackageId } from "@/lib/utils";
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

interface SubscriptionProjectMeta {
  source?: string;
  request?: {
    title?: string | null;
    description?: string | null;
    services?: string[];
    budget?: string | null;
    deadline?: string | null;
    notes?: string | null;
  };
  onboarding?: {
    websiteGoals?: string | null;
    hasBranding?: string | null;
    brandingNotes?: string | null;
    pagesFeatures?: string | null;
    projectApproach?: string | null;
  };
}

function parseSubscriptionProjectMeta(raw: string | null): SubscriptionProjectMeta | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as SubscriptionProjectMeta;
  } catch {
    return null;
  }
}

function getFirstDayOfNextMonth(from = new Date()) {
  return new Date(from.getFullYear(), from.getMonth() + 1, 1, 0, 0, 0, 0);
}

function sanitizeServices(services: unknown) {
  if (!Array.isArray(services)) return [];
  return services.map((service) => String(service).trim()).filter(Boolean);
}

function parseDeadline(deadline: string | null | undefined) {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

async function ensureProjectForSubscription(sub: {
  id: string;
  userId: string;
  package: string;
  businessName: string | null;
  description: string | null;
  budget: string | null;
  timeline: string | null;
  hostingPlan: string | null;
  features: string | null;
}) {
  const existing = await prisma.project.findFirst({
    where: { userId: sub.userId, subscriptionId: sub.id },
  });

  if (existing) return;

  const pkgId = sub.package as AnyPackageId;
  const packageName = ALL_PACKAGES[pkgId]?.name ?? sub.package;
  const isCrmProject = sub.package.startsWith("crm-");

  const meta = parseSubscriptionProjectMeta(sub.features);
  const requestMeta = meta?.request;
  const services = sanitizeServices(requestMeta?.services);
  const hasDetailedRequest = Boolean(
    requestMeta?.title ||
      requestMeta?.description ||
      requestMeta?.budget ||
      requestMeta?.deadline ||
      requestMeta?.notes ||
      services.length
  );

  const title = requestMeta?.title?.trim()
    || sub.businessName?.trim()
    || (isCrmProject ? `${packageName} CRM Setup` : `${packageName} Website Project`);

  const description = requestMeta?.description?.trim() || sub.description || null;

  const noteParts = [
    meta?.onboarding?.projectApproach?.trim() ? `Project approach: ${meta.onboarding.projectApproach.trim()}` : "",
    requestMeta?.notes?.trim(),
    sub.timeline?.trim() ? `Preferred timeline: ${sub.timeline.trim()}` : "",
    sub.hostingPlan && sub.hostingPlan !== "none" ? `Hosting plan: ${sub.hostingPlan}` : "",
  ].filter(Boolean);

  await prisma.project.create({
    data: {
      userId: sub.userId,
      subscriptionId: sub.id,
      title,
      type: isCrmProject ? "crm" : hasDetailedRequest ? "request" : "website",
      status: "requested",
      progress: 0,
      description,
      notes: noteParts.length > 0 ? noteParts.join(" | ") : null,
      services: services.length > 0 ? JSON.stringify(services) : null,
      budget: requestMeta?.budget?.trim() || sub.budget || null,
      deadline: parseDeadline(requestMeta?.deadline),
    },
  });
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

  const isWebsiteBuild = sub.package in PACKAGES;
  const hasRecurringHosting = isWebsiteBuild && (sub.hostingAmount ?? 0) > 0;
  const isCrmSubscription = sub.package.startsWith("crm-");
  const shouldSetRecurringBilling = hasRecurringHosting || isCrmSubscription;
  const nextBilling = shouldSetRecurringBilling
    ? (sub.nextBillingDate ?? getFirstDayOfNextMonth(new Date()))
    : null;

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "active", paid: true, nextBillingDate: nextBilling },
  });

  await ensureProjectForSubscription({
    id: sub.id,
    userId: sub.userId,
    package: sub.package,
    businessName: sub.businessName,
    description: sub.description,
    budget: sub.budget,
    timeline: sub.timeline,
    hostingPlan: sub.hostingPlan,
    features: sub.features,
  });

  const packageName = ALL_PACKAGES[sub.package as AnyPackageId]?.name ?? sub.package;
  return { success: true, packageName };
}
