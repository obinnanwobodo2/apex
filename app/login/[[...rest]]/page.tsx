import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { getSafeRedirectPath } from "@/lib/auth-redirect";

interface LoginPageProps {
  searchParams?: {
    redirect_url?: string | string[];
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectUrl = getSafeRedirectPath(searchParams?.redirect_url, "/dashboard");
  const signUpUrl = `/register?redirect_url=${encodeURIComponent(redirectUrl)}`;
  const isAdminLoginFlow =
    redirectUrl === "/admin" ||
    redirectUrl.startsWith("/admin/") ||
    redirectUrl.startsWith("/api/admin");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-green/10 flex flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8">
        <Image src="/logo.svg" alt="Apex Visual" width={150} height={60} className="h-10 w-auto" />
      </Link>
      <SignIn
        routing="path"
        path="/login"
        {...(!isAdminLoginFlow ? { signUpUrl } : {})}
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "rounded-2xl shadow-lg border border-gray-100",
            headerTitle: "text-brand-navy font-extrabold",
            formButtonPrimary: "bg-brand-green hover:bg-brand-green/90 text-white",
            ...(isAdminLoginFlow
              ? { footerAction: "hidden", footerActionLink: "hidden" }
              : { footerActionLink: "text-brand-green hover:underline" }),
          },
        }}
      />
    </div>
  );
}
