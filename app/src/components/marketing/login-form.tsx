"use client";

import { useRef, useState, type FormEvent } from "react";
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
  const [oauthError, setOauthError] = useState<string | null>(null);
  // Synchronous lock — `setSubmitting` is async, so the disabled button alone
  // can't stop two clicks fired before the next render from both submitting.
  const submitLock = useRef(false);

  async function handleGoogle() {
    setOauthError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setOauthError(error.message);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;
    setMessage(null);
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return setMessage("Invalid email or password.");
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
    } catch {
      setMessage("Sign-in is unavailable right now. Please try again.");
    } finally {
      submitLock.current = false;
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

        {/* Google OAuth */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-[var(--mk-radius)] border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: "var(--mk-border)", color: "var(--mk-text)" }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
          {oauthError && (
            <p className="text-sm" role="alert" style={{ color: "var(--mk-accent)" }}>{oauthError}</p>
          )}
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" style={{ borderColor: "var(--mk-border)" }} />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 text-xs" style={{ background: "var(--mk-surface)", color: "var(--mk-text-muted)" }}>or continue with email</span>
          </div>
        </div>

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
