"use client";

import { useEffect } from "react";

interface RuntimeErrorPayload {
  source: "window_error" | "unhandled_rejection";
  message: string;
  stack?: string;
  pathname: string;
  userAgent: string;
}

const MAX_MESSAGE = 600;
const MAX_STACK = 2000;

function trimValue(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function reportRuntimeError(payload: RuntimeErrorPayload) {
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/monitoring/client-errors", blob);
      return;
    }
  } catch {
    // Fall back to fetch.
  }

  void fetch("/api/monitoring/client-errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    cache: "no-store",
  }).catch(() => {
    // ignore network failures for best-effort telemetry
  });
}

export default function RuntimeErrorListener() {
  useEffect(() => {
    const sentEvents = new Set<string>();

    const onError = (event: ErrorEvent) => {
      const message = trimValue(event.message, MAX_MESSAGE);
      if (!message) return;

      const stack = trimValue(event.error?.stack ?? "", MAX_STACK);
      const fingerprint = `e:${message}:${stack.slice(0, 200)}`;
      if (sentEvents.has(fingerprint)) return;
      sentEvents.add(fingerprint);

      reportRuntimeError({
        source: "window_error",
        message,
        stack,
        pathname: window.location.pathname,
        userAgent: navigator.userAgent,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const rawMessage =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";
      const message = trimValue(rawMessage, MAX_MESSAGE);
      if (!message) return;

      const stack = trimValue(reason instanceof Error ? reason.stack ?? "" : "", MAX_STACK);
      const fingerprint = `r:${message}:${stack.slice(0, 200)}`;
      if (sentEvents.has(fingerprint)) return;
      sentEvents.add(fingerprint);

      reportRuntimeError({
        source: "unhandled_rejection",
        message,
        stack,
        pathname: window.location.pathname,
        userAgent: navigator.userAgent,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
