"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface TermlyPolicyEmbedProps {
  policyId: string | null;
  title: string;
}

export default function TermlyPolicyEmbed({ policyId, title }: TermlyPolicyEmbedProps) {
  const embedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!policyId || !embedRef.current) return;
    embedRef.current.setAttribute("name", "termly-embed");
  }, [policyId]);

  if (!policyId) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{title} (Termly)</p>
      <div ref={embedRef} data-id={policyId} data-type="iframe" />
      <Script
        id={`termly-policy-${policyId}`}
        src="https://app.termly.io/embed-policy.min.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
