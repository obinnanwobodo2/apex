import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { getSafeRedirectPath } from "@/lib/auth-redirect";

interface RegisterPageProps {
  searchParams?: {
    redirect_url?: string | string[];
  };
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const redirectUrl = getSafeRedirectPath(searchParams?.redirect_url, "/dashboard/settings?onboarding=1");
  const signInUrl = `/login?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-green/10 flex flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8">
        <Image src="/logo.svg" alt="Apex Visuals" width={150} height={60} className="h-10 w-auto" />
      </Link>
      <div className="w-full max-w-md mb-4 rounded-xl border border-brand-green/20 bg-brand-green/5 px-4 py-3 text-xs text-brand-navy">
        We ask for additional identity and business details after signup to keep client accounts secure.
      </div>
      <SignUp
        routing="path"
        path="/register"
        signInUrl={signInUrl}
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "rounded-2xl shadow-lg border border-gray-100",
            headerTitle: "text-brand-navy font-extrabold",
            formButtonPrimary: "bg-brand-green hover:bg-brand-green/90 text-white",
            footerActionLink: "text-brand-green hover:underline",
          },
        }}
      />
    </div>
  );
}
