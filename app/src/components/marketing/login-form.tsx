"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

// WEB-012 — Login UI only. Auth is STUBBED (no Supabase / useAuth import) — real
// auth wiring is IPI2-127. Submit just surfaces a placeholder message.
type Mode = "login" | "signup";

const field =
  "w-full rounded-[var(--mk-radius)] border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [message, setMessage] = useState<string | null>(null);

  // TODO(IPI2-127): wire to Supabase auth (signInWithPassword / signUp) once the
  // operator auth identity lands. Keep this component free of the supabase client
  // and AuthContext until then.
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(
      mode === "login"
        ? "Sign-in is not connected yet — operator auth ships with IPI2-127."
        : "Sign-up is not connected yet — operator auth ships with IPI2-127.",
    );
  };

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
          <button type="submit" className="w-full rounded-[var(--mk-radius)] px-4 py-2.5 text-sm font-medium text-white" style={{ background: "var(--mk-text)" }}>
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
