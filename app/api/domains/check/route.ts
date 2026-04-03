import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  checkDomainAvailability,
  formatDomainPrice,
  generateDomainSuggestions,
  getDomainPrice,
  isSupportedDomain,
  normalizeDomain,
} from "@/lib/domain-service";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rawDomain = searchParams.get("domain") ?? "";
  const domain = normalizeDomain(rawDomain);

  if (!domain) {
    return NextResponse.json({ error: "Please enter a valid domain like mybusiness.co.za" }, { status: 400 });
  }

  const result = await checkDomainAvailability(domain);
  const supported = isSupportedDomain(domain);
  const suggestions = result.available ? [] : generateDomainSuggestions(domain);

  return NextResponse.json({
    ...result,
    suggestions,
    supported,
    price: getDomainPrice(domain),
    priceLabel: formatDomainPrice(domain),
    accuracy: result.source === "registrar" ? "registrar_verified" : "rdap_lookup",
    notice: !supported
      ? "This TLD is not currently sold directly in-app. Contact support for manual order."
      : result.source === "rdap"
      ? "Availability was checked via RDAP fallback. Registrar check is recommended before payment."
      : null,
  });
}
