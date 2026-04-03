import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const sansFont = localFont({
  src: "./fonts/GeistVF.woff",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

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
        <body className={sansFont.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
