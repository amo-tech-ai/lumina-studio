"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { validateUrl, createOrgAndBrand, invokeStartBrandCrawl, invokeBrandIntelligence, type OnboardingForm } from "@/lib/onboarding";

const INDUSTRIES = ["Fashion", "Jewellery", "Beauty", "Home & Living", "Other"] as const;
const GOALS = ["Product Photography", "Campaign Planning", "Brand Intelligence", "All of the above"] as const;

const DOTS = [1, 2, 3];

const OnboardingPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OnboardingForm>({
    brandName: "",
    websiteUrl: "",
    instagramHandle: "",
    industry: "Fashion",
    goal: "All of the above",
  });
  const [urlError, setUrlError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shell, setShell] = useState<{ orgId: string; brandId: string } | null>(null);

  const setField = (field: keyof OnboardingForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setShell(null);
    if (field === "websiteUrl") setUrlError(null);
    if (field === "brandName") setNameError(null);
  };

  const validateStep2 = (): boolean => {
    if (!form.brandName.trim()) { setNameError("Brand name is required"); return false; }
    const err = validateUrl(form.websiteUrl);
    if (err) { setUrlError(err); return false; }
    return true;
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let brandId = shell?.brandId;
      if (!brandId) {
        const created = await createOrgAndBrand(supabase, user.id, form);
        brandId = created.brandId;
        setShell(created);
      }

      let crawlResultId: string | undefined;
      try {
        const crawl = await invokeStartBrandCrawl(supabase, brandId, form.websiteUrl, {
          idempotencyKey: `onboarding-${brandId}`,
        });
        crawlResultId = crawl.crawlId;
      } catch (crawlErr) {
        console.warn(
          "start-brand-crawl failed, continuing with brand intelligence:",
          crawlErr,
        );
      }

      await invokeBrandIntelligence(supabase, brandId, form, { crawlResultId });

      router.push(`/app/brand/${brandId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#FBF8F5" }}>
      <div className="w-full max-w-lg">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {DOTS.map((d) => (
            <span
              key={d}
              className="w-2 h-2 rounded-full transition-colors"
              style={{ background: d <= step ? "#E87C4D" : "#D1C9C0" }}
            />
          ))}
        </div>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="text-center space-y-6">
            <h1 className="font-serif text-4xl text-[#1E293B]">Let&apos;s set up your brand</h1>
            <p className="font-sans text-[#64748B] text-lg leading-relaxed">
              It takes about 2 minutes. We&apos;ll analyze your brand and get you ready to shoot.
            </p>
            <button
              onClick={() => setStep(2)}
              className="mt-4 px-8 py-3 rounded-full font-sans font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "#E87C4D" }}
            >
              Get started
            </button>
          </div>
        )}

        {/* Step 2 — Brand details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl text-[#1E293B]">Tell us about your brand</h2>
              <p className="font-sans text-[#64748B] mt-1">Step 2 of 3</p>
            </div>

            <div className="space-y-4">
              <label className="font-sans text-sm font-medium text-[#1E293B] block">
                Brand name <span className="text-[#E87C4D]">*</span>
                <input
                  type="text"
                  value={form.brandName}
                  onChange={(e) => setField("brandName", e.target.value)}
                  placeholder="e.g. Maison Lumière"
                  className={`mt-1 w-full px-4 py-2.5 rounded-lg border bg-white font-sans font-normal text-[#1E293B] focus:outline-none ${
                    nameError ? "border-red-400 focus:border-red-400" : "border-[#D1C9C0] focus:border-[#E87C4D]"
                  }`}
                />
                {nameError && <span className="font-sans font-normal text-sm text-red-500 mt-1 block">{nameError}</span>}
              </label>

              <label className="font-sans text-sm font-medium text-[#1E293B] block">
                Website URL <span className="text-[#E87C4D]">*</span>
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => setField("websiteUrl", e.target.value)}
                  placeholder="https://yourbrand.com"
                  className={`mt-1 w-full px-4 py-2.5 rounded-lg border bg-white font-sans font-normal text-[#1E293B] focus:outline-none ${
                    urlError ? "border-red-400 focus:border-red-400" : "border-[#D1C9C0] focus:border-[#E87C4D]"
                  }`}
                />
                {urlError && <span className="font-sans font-normal text-sm text-red-500 mt-1 block">{urlError}</span>}
              </label>

              <label className="font-sans text-sm font-medium text-[#1E293B] block">
                Instagram handle <span className="text-[#94A3B8] font-normal">(optional)</span>
                <input
                  type="text"
                  value={form.instagramHandle}
                  onChange={(e) => setField("instagramHandle", e.target.value)}
                  placeholder="@yourbrand"
                  className="mt-1 w-full px-4 py-2.5 rounded-lg border border-[#D1C9C0] bg-white font-sans font-normal text-[#1E293B] focus:outline-none focus:border-[#E87C4D]"
                />
              </label>

              <label className="font-sans text-sm font-medium text-[#1E293B] block">
                Industry
                <select
                  value={form.industry}
                  onChange={(e) => setField("industry", e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 rounded-lg border border-[#D1C9C0] bg-white font-sans font-normal text-[#1E293B] focus:outline-none focus:border-[#E87C4D]"
                >
                  {INDUSTRIES.map((ind) => <option key={ind}>{ind}</option>)}
                </select>
              </label>

              <label className="font-sans text-sm font-medium text-[#1E293B] block">
                Primary goal
                <select
                  value={form.goal}
                  onChange={(e) => setField("goal", e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 rounded-lg border border-[#D1C9C0] bg-white font-sans font-normal text-[#1E293B] focus:outline-none focus:border-[#E87C4D]"
                >
                  {GOALS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 rounded-full font-sans font-medium text-[#64748B] border border-[#D1C9C0] hover:border-[#94A3B8] transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => { if (validateStep2()) setStep(3); }}
                className="flex-1 px-6 py-2.5 rounded-full font-sans font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "#E87C4D" }}
              >
                Analyze my brand
              </button>
            </div>

            <button
              onClick={() => router.push("/app?skip=1")}
              className="w-full font-sans text-sm text-[#94A3B8] hover:text-[#64748B] transition-colors text-center pt-1"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 3 — Analysis */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <h2 className="font-serif text-3xl text-[#1E293B]">Analyzing your brand</h2>
            <p className="font-sans text-[#64748B]">Step 3 of 3</p>

            {loading && !error && (
              <div className="space-y-4 py-6">
                <div className="w-12 h-12 rounded-full border-4 border-t-[#E87C4D] border-[#F3E8E0] animate-spin mx-auto" />
                <p className="font-sans text-[#64748B]">Analyzing your brand with AI…</p>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-4 py-4">
                <p className="font-sans text-[#64748B]">
                  Ready to analyze <strong className="text-[#1E293B]">{form.brandName}</strong>.
                </p>
                <button
                  onClick={runAnalysis}
                  className="px-8 py-3 rounded-full font-sans font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: "#E87C4D" }}
                >
                  Start analysis
                </button>
              </div>
            )}

            {error && (
              <div className="space-y-4 py-4">
                <p className="font-sans text-red-500 text-sm">{error}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 rounded-full font-sans font-medium text-[#64748B] border border-[#D1C9C0] hover:border-[#94A3B8] transition-colors"
                  >
                    Edit details
                  </button>
                  <button
                    onClick={runAnalysis}
                    className="px-6 py-2.5 rounded-full font-sans font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: "#E87C4D" }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
