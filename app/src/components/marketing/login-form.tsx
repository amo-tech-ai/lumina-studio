"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeRedirect } from "@/lib/safe-redirect";

// WEB-012 + IPI2-127 — Supabase email/password auth. On success the browser
// client writes the sb-*-auth-token session cookie that the /app/* proxy gate +
// CopilotKit runtime validate.
type Mode = "login" | "signup";

const field =
  "w-full rounded-[var(--mk-radius)] border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "login") {
        // Supabase returns a generic "Invalid login credentials" here (no
        // account enumeration), so surfacing it directly is safe.
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return setMessage(error.message);
      } else {
        const { data: signUp, error } = await supabase.auth.signUp({ email, password });
        // Never surface "User already registered" — that enumerates accounts.
        if (error) return setMessage("If this email is eligible, check your inbox or sign in.");
        if (!signUp.session) {
          return setMessage("Account created — check your email to confirm, then sign in.");
        }
      }
      const target = safeRedirect(new URLSearchParams(window.location.search).get("redirect"));
      router.push(target);
      router.refresh();
    } catch {
      setMessage("Sign-in is unavailable right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <Link href="/" className="text-3xl tracking-tight" style={{ fontFamily: "var(--font-cormorant)" }}>
          Lumina Studio
        </Link>
        <p className="text-sm" style={{ color: "var(--mk-text-muted)" }}>Operator sign in for brand intelligence</p>
      </div>

      <div className="rounded-[var(--mk-radius)] p-6 lg:p-8" style={{ background: "var(--mk-surface)", border: "1px solid var(--mk-border)" }}>
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-cormorant)" }}>Welcome</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--mk-text-muted)" }}>Sign in or create an account to access the dashboard.</p>

        {/* Tabs */}
        <div className="mb-6 mt-6 grid grid-cols-2 rounded-[var(--mk-radius)] p-1" style={{ background: "var(--mk-bg)" }}>
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setMessage(null); }}
              aria-pressed={mode === m}
              className="rounded-[var(--mk-radius)] py-2 text-sm font-medium transition-colors"
              style={mode === m ? { background: "var(--mk-text)", color: "#fff" } : { color: "var(--mk-text-muted)" }}
            >
              {m === "login" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className={field} style={{ borderColor: "var(--mk-border)" }} />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} className={field} style={{ borderColor: "var(--mk-border)" }} />
          </div>
          {message && (
            <p className="text-sm" role="status" style={{ color: "var(--mk-text-muted)" }}>{message}</p>
          )}
          <button type="submit" disabled={submitting} className="w-full rounded-[var(--mk-radius)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60" style={{ background: "var(--mk-text)" }}>
            {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
