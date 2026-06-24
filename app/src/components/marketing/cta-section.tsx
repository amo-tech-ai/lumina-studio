"use client";

import { useState } from "react";
import { AnimatedSection } from "./animated-section";

// Parity with Vite CTASection.tsx — centered inquiry form. Static / no backend
// (WEB-002 scope): submit just shows a thank-you. Wire to a real endpoint later.
const field =
  "w-full border-b bg-transparent py-3 text-sm focus:outline-none transition-colors";

export function CTASection() {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" className="py-24 lg:py-32" style={{ background: "var(--mk-surface)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-4xl font-light md:text-5xl lg:text-6xl">
            Ready to Elevate
            <br />
            <span className="italic">Your Content?</span>
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed md:text-lg" style={{ color: "var(--mk-text-muted)" }}>
            Tell us about your brand and we&apos;ll craft a tailored content strategy
            — powered by AI, executed by experts.
          </p>

          {sent ? (
            <p className="text-lg" style={{ color: "var(--mk-primary)" }}>
              Thanks — we&apos;ll be in touch shortly.
            </p>
          ) : (
            <form
              className="mx-auto max-w-lg space-y-6 text-left"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <input type="text" required placeholder="Name" aria-label="Name" className={field} style={{ borderColor: "var(--mk-border)" }} />
                <input type="email" required placeholder="Email" aria-label="Email" className={field} style={{ borderColor: "var(--mk-border)" }} />
              </div>
              <input type="text" placeholder="Company" aria-label="Company" className={field} style={{ borderColor: "var(--mk-border)" }} />
              <textarea placeholder="Tell us about your project" aria-label="Tell us about your project" rows={4} className={`${field} resize-none`} style={{ borderColor: "var(--mk-border)" }} />
              <button
                type="submit"
                className="px-10 py-4 text-sm font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--mk-text)" }}
              >
                Send Inquiry
              </button>
            </form>
          )}
        </AnimatedSection>
      </div>
    </section>
  );
}
