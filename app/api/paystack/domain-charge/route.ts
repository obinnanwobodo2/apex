import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateReference, initializeTransaction } from "@/lib/paystack";
import { readJsonObject, sanitizeText } from "@/lib/validation";

const DOMAIN_PRICES: Record<string, number> = {
  ".co.za": 180,
  ".com": 280,
  ".net": 290,
  ".org": 260,
  ".io": 620,
  ".dev": 350,
};

function domainPrice(extension: string) {
  return DOMAIN_PRICES[extension] ?? 250;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const requestId = sanitizeText(body.requestId, { maxLength: 128 });
  if (!requestId) return NextResponse.json({ error: "Request id is required." }, { status: 400 });

  const request = await prisma.domainRequest.findFirst({
    where: { id: requestId, clientId: userId },
  });
  if (!request) return NextResponse.json({ error: "Domain request not found." }, { status: 404 });

  if (request.paymentType !== "once-off") {
    return NextResponse.json({ error: "This request is billed monthly and cannot be paid once-off." }, { status: 400 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.trim();
  if (!email) return NextResponse.json({ error: "Email address is not available." }, { status: 400 });

  const amount = domainPrice(request.extension);
  const reference = generateReference("DOM");
  const origin = (req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "").trim();
  if (!origin) return NextResponse.json({ error: "Application URL is not configured" }, { status: 500 });

  const fqdn = `${request.domainName}${request.extension}`.toLowerCase();
  const callbackUrl = `${origin}/dashboard/billing?success=true&type=domain&requestId=${encodeURIComponent(request.id)}`;

  const result = await initializeTransaction({
    email,
    amount: Math.round(amount * 100),
    currency: "ZAR",
    reference,
    callback_url: callbackUrl,
    metadata: {
      custom_fields: [
        { display_name: "Type", variable_name: "type", value: "domain" },
        { display_name: "Domain", variable_name: "domain", value: fqdn },
      ],
      package: "domain-request",
      subscription_id: request.id,
      type: "domain",
      domainRequestId: request.id,
      clientId: userId,
      domain: fqdn,
      extension: request.extension,
      paymentType: request.paymentType,
    },
  });

  await prisma.domainRequest.update({
    where: { id: request.id },
    data: {
      paymentStatus: "processing",
      checkedNote: `Paystack reference: ${reference}`,
    },
  });

  return NextResponse.json({
    authorization_url: result.authorization_url,
    reference,
  });
}
