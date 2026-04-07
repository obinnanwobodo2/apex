import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}${month}-${random}`;
}

export function calculateVAT(amount: number, vatRate = 0.15): number {
  return amount * vatRate;
}

export function calculateTotal(amount: number, vatRate = 0.15): number {
  return amount + calculateVAT(amount, vatRate);
}

export const PACKAGES = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 400,
    badge: "GROWING BUSINESSES",
    tagline: "Best For: Growing Businesses",
    turnaround: "5–7 business days",
    popular: false,
    features: [
      "Clean, professional website design",
      "Mobile-optimized experience",
      "Essential functionality setup (contact, navigation, basics)",
      "Light monthly updates & edits",
      "Hosting & domain guidance",
      "Basic SEO foundation",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    price: 700,
    badge: "MOST POPULAR",
    tagline: "High-Performance & Conversion-Focused",
    turnaround: "7–10 business days",
    popular: true,
    features: [
      "High-quality, conversion-focused website",
      "Fast, mobile-first performance",
      "Integrated contact + WhatsApp lead system",
      "Structured content designed to convert visitors",
      "Ongoing improvements & content updates",
      "Full on-page SEO optimization",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 1199,
    badge: "FULL SERVICE",
    tagline: "Premium & Full-Service",
    turnaround: "10–14 business days",
    popular: false,
    features: [
      "Premium custom website design & branding",
      "Advanced user experience & conversion strategy",
      "E-commerce capability (sales-ready setup)",
      "Unlimited content updates & scaling support",
      "Advanced SEO + blog/content system",
      "Monthly performance analytics & insights",
    ],
  },
} as const;

export type PackageId = keyof typeof PACKAGES;
export type Package = (typeof PACKAGES)[PackageId];

export const CRM_PACKAGES = {
  "crm-pro": {
    id: "crm-pro",
    name: "CRM Pro",
    price: 199,
    badge: "PRO",
    tagline: "One complete CRM plan for growing businesses",
    turnaround: "1–2 business days setup",
    popular: true,
    features: [
      "Unlimited contacts and deal tracking",
      "Tasks, reminders, and activity timeline",
      "AI assistant for follow-ups and insights",
      "Real-time notifications and messaging",
      "Paystack billing, excl. VAT, cancel anytime",
    ],
  },
} as const;

export type CrmPackageId = keyof typeof CRM_PACKAGES;

export const ALL_PACKAGES = {
  ...PACKAGES,
  ...CRM_PACKAGES,
} as const;

export type AnyPackageId = keyof typeof ALL_PACKAGES;
export type AnyPackage = (typeof ALL_PACKAGES)[AnyPackageId];
