import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { initializeTransaction, generateReference } from "@/lib/paystack";
import { readJsonObject, sanitizeText } from "@/lib/validation";

const PLAN_ENV_MAP: Record<string, string | undefined> = {
  starter: process.env.PAYSTACK_PLAN_STARTER,
  growth: process.env.PAYSTACK_PLAN_GROWTH,
  pro: process.env.PAYSTACK_PLAN_PRO,
  crm: process.env.PAYSTACK_PLAN_CRM,
  "crm-pro": process.env.PAYSTACK_PLAN_CRM,
};

function resolvePlanCode(inputPlanCode: string | null, packageId: string | null) {
  if (inputPlanCode) return inputPlanCode;
  if (!packageId) return process.env.PAYSTACK_PLAN_CRM?.trim() || null;
  return PLAN_ENV_MAP[packageId]?.trim() || null;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonObject(req);
  const providedPlanCode = sanitizeText(body?.planCode, { maxLength: 120 });
  const packageId = sanitizeText(body?.packageId, { maxLength: 80 });
  const planCode = resolvePlanCode(providedPlanCode, packageId);
  if (!planCode) return NextResponse.json({ error: "Plan code is not configured." }, { status: 400 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.trim();
  if (!email) return NextResponse.json({ error: "Email address is required." }, { status: 400 });

  const origin = (req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "").trim();
  if (!origin) return NextResponse.json({ error: "Application URL is not configured" }, { status: 500 });

  const reference = generateReference("SUB");
  const result = await initializeTransaction({
    email,
    currency: "ZAR",
    reference,
    callback_url: `${origin}/dashboard/billing?success=true`,
    plan: planCode,
    metadata: {
      custom_fields: [
        { display_name: "Type", variable_name: "type", value: "subscription" },
        { display_name: "Client", variable_name: "client_id", value: userId },
      ],
      package: packageId ?? "subscription",
      subscription_id: userId,
      type: "subscription",
      clientId: userId,
      planCode,
      packageId: packageId ?? "subscription",
    },
  });

  return NextResponse.json({
    authorization_url: result.authorization_url,
    reference: result.reference,
  });
}
