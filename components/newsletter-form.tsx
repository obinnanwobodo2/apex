"use client";

import { FormEvent, useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not subscribe right now.");
      setMessage("Subscribed. We will share occasional product updates.");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not subscribe right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-2">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block">Newsletter</label>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
      {message && <p className="text-xs text-brand-green">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
