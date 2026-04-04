"use client";

import { useEffect } from "react";
import Link from "next/link";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

async function reportBoundaryError(payload: Record<string, string>) {
  try {
    await fetch("/api/monitoring/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      cache: "no-store",
    });
  } catch {
    // no-op
  }
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    void reportBoundaryError({
      source: "global_error_boundary",
      message: error.message || "Unexpected global application error",
      stack: error.stack || "",
      pathname: "global",
      userAgent: typeof navigator === "undefined" ? "unknown" : navigator.userAgent,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-brand-navy">Application error</h1>
          <p className="mt-2 text-sm text-gray-600">
            A critical error occurred. Monitoring was notified. Try reloading or return home.
          </p>
          {error.digest && (
            <p className="mt-3 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-500">
              Error reference: {error.digest}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={reset}
              className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green/90"
            >
              Reload
            </button>
            <Link
              href="/"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-gray-100"
            >
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
