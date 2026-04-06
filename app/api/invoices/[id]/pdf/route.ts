import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ALL_PACKAGES, formatCurrency } from "@/lib/utils";
import { sanitizeText } from "@/lib/validation";

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildInvoicePdf(lines: string[]) {
  const textCommands = lines
    .map((line, index) => {
      const y = 800 - index * 18;
      return `BT /F1 12 Tf 50 ${y} Td (${escapePdfText(line)}) Tj ET`;
    })
    .join("\n");

  const stream = `${textCommands}\n`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}endstream\nendobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscriptionId = sanitizeText(params.id, { maxLength: 64 });
  if (!subscriptionId) {
    return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      userId,
    },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (!subscription.paid) {
    return NextResponse.json({ error: "Invoice is not paid yet." }, { status: 400 });
  }

  const packageName = ALL_PACKAGES[subscription.package as keyof typeof ALL_PACKAGES]?.name ?? subscription.package;
  const isDomainOrder =
    subscription.projectType === "domain_registration" || subscription.package === "domain-registration";
  const displayName = isDomainOrder
    ? `${subscription.businessName || "Domain"} Registration`
    : `${packageName} Package`;

  const lines = [
    "Apex Visual - Tax Invoice (Paid)",
    "",
    `Invoice Number: ${subscription.invoiceNumber ?? subscription.id}`,
    `Invoice Date: ${subscription.createdAt.toLocaleDateString("en-ZA")}`,
    `Status: PAID`,
    "",
    `Client: ${subscription.businessName ?? "Client"}`,
    `Contact: ${subscription.contactPerson ?? "N/A"}`,
    "",
    `Item: ${displayName}`,
    `Amount Paid: ${formatCurrency(subscription.amountPaid || subscription.amount)}`,
    `Billing Type: ${isDomainOrder ? "Annual" : "Monthly (1st day of month)"}`,
    subscription.nextBillingDate
      ? `Next Billing Date: ${subscription.nextBillingDate.toLocaleDateString("en-ZA")}`
      : "Next Billing Date: N/A",
    "",
    "Thank you for your payment.",
    "Apex Visual | info@apexvisual.co.za",
  ];

  const pdf = buildInvoicePdf(lines);
  const filename = `${(subscription.invoiceNumber ?? subscription.id).replace(/\s+/g, "-")}.pdf`;

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
