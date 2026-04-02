import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Apex Visuals — Monthly Website Care Retainer",
  description:
    "Professional website design, hosting, and monthly care packages for South African businesses. Choose your plan and get online fast.",
  keywords: "website design, web development, monthly retainer, South Africa, Apex Visuals",
  openGraph: {
    title: "Apex Visuals — Monthly Website Care Retainer",
    description: "Professional website care packages for South African businesses.",
    siteName: "Apex Visuals",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
