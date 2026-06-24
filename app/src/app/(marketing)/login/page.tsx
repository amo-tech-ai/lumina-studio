import type { Metadata } from "next";
import { LoginForm } from "@/components/marketing/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Lumina Studio for AI-powered brand intelligence.",
  robots: { index: false, follow: false },
};

// WEB-012 — Login (UI only, noindex). In the (marketing) group so it gets brand
// fonts/tokens + header/footer; auth is stubbed in LoginForm (IPI2-127).
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-24" style={{ background: "var(--mk-surface-warm)" }}>
      <LoginForm />
    </div>
  );
}
