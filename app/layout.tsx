import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import RuntimeErrorListener from "@/components/runtime-error-listener";
import FacebookPixels from "@/components/facebook-pixels";
import "./globals.css";

const sansFont = localFont({
  src: "./fonts/GeistVF.woff",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Apex Visual — Monthly Website Care Retainer",
  description:
    "Professional website design, hosting, and monthly care packages for South African businesses. Choose your plan and get online fast.",
  keywords: "website design, web development, monthly retainer, South Africa, Apex Visual",
  openGraph: {
    title: "Apex Visual — Monthly Website Care Retainer",
    description: "Professional website care packages for South African businesses.",
    siteName: "Apex Visual",
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
        <body className={sansFont.className}>
          <RuntimeErrorListener />
          <FacebookPixels />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
