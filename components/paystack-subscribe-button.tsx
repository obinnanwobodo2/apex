"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { Loader2 } from "lucide-react";

interface PaystackSubscribeButtonProps {
  className?: string;
  packageId?: string;
  planCode?: string;
  children: React.ReactNode;
  style?: CSSProperties;
}

export default function PaystackSubscribeButton({
  className,
  packageId = "crm-pro",
  planCode,
  children,
  style,
}: PaystackSubscribeButtonProps) {
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/paystack/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          planCode: planCode || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to initialize subscription.");
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={subscribe} disabled={loading} className={className} style={style}>
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening checkout...
        </span>
      ) : children}
    </button>
  );
}
