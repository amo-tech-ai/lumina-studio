"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Link as LinkIcon, Sparkles, ListChecks, Check, User } from "lucide-react";
import { WizardStep, type WizardStepMeta } from "@/components/ui/wizard-step";
import { ApprovalCard } from "@/components/ui/approval-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { useAuthUser } from "@/lib/auth-client";
import {
  INITIAL_ONBOARDING_FIELDS,
  resetFieldsFromAnalysis,
  type AnalyzedField,
  type OnboardingField,
} from "@/lib/talent/onboarding-fields";

type Step = 1 | 2 | 3 | 4;

export function TalentOnboardingWizard() {
  const { user } = useAuthUser();
  const [step, setStep] = useState<Step>(1);
  const [scanned, setScanned] = useState(0);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null);
  const [fields, setFields] = useState<OnboardingField[]>(INITIAL_ONBOARDING_FIELDS);
  const analysisRequestId = useRef(0);
  const publishingLock = useRef(false);

  const steps: WizardStepMeta[] = [
    { icon: LinkIcon, label: "Connect", sub: "Paste your link" },
    { icon: Sparkles, label: "Analyse", sub: "AI reads your content" },
    { icon: ListChecks, label: "Review", sub: "Approve every field" },
    { icon: Check, label: "Go live", sub: "Publish your profile" },
  ];

  useEffect(() => {
    if (step !== 2) return;
    setScanned(0);
    const timer = setInterval(() => {
      setScanned((prev) => {
        const next = Math.min(128, prev + 9);
        if (next >= 128) clearInterval(timer);
        return next;
      });
    }, 130);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step !== 2 || scanned < 128) return;
    const timeout = setTimeout(() => setStep(3), 550);
    return () => clearTimeout(timeout);
  }, [step, scanned]);

  const handleAnalyse = async () => {
    if (!name || !url || isAnalyzing) return;

    const requestId = ++analysisRequestId.current;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/talent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        fields?: AnalyzedField[];
        error?: string;
      };

      if (requestId !== analysisRequestId.current) return;

      if (data.success && data.fields) {
        setFields((prev) => resetFieldsFromAnalysis(prev, data.fields ?? []));
        setStep(2);
        return;
      }

      setAnalysisError(data.error || "Analysis failed");
    } catch {
      if (requestId !== analysisRequestId.current) return;
      setAnalysisError("Failed to analyze profile. Please try again.");
    } finally {
      if (requestId === analysisRequestId.current) setIsAnalyzing(false);
    }
  };

  const updateField = (index: number, patch: Partial<OnboardingField>) => {
    setFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...patch };
      return updated;
    });
  };

  const reviewedCount = fields.filter((field) => field.status !== "ai").length;
  const allReviewed = reviewedCount === fields.length;

  const handleFinishPublish = async () => {
    if (!allReviewed || publishingLock.current) return;

    publishingLock.current = true;
    setIsPublishing(true);
    setPublishError(null);

    try {
      const response = await fetch("/api/talent/profile-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: fields.find((field) => field.key === "name")?.value || name,
          bio: fields.find((field) => field.key === "bio")?.value,
          handle: fields.find((field) => field.key === "handle")?.value,
          niche: fields.find((field) => field.key === "niche")?.value,
          location: fields.find((field) => field.key === "loc")?.value,
          dayRate: fields.find((field) => field.key === "rate")?.value,
          languages: [],
          sourceUrl: url,
          profileId: user?.id,
          analyzedFields: fields.map((field) => ({
            key: field.key,
            value: field.value,
            confidence: field.confidence,
            evidence: field.evidence,
            status: field.status === "edited" ? "edited" : "approved",
          })),
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        profile?: { id: string };
        error?: string;
      };

      if (data.success && data.profile) {
        setCreatedProfileId(data.profile.id);
        setStep(4);
        return;
      }

      setPublishError(data.error || "Failed to publish profile. Please try again.");
      publishingLock.current = false;
    } catch {
      setPublishError("Failed to publish profile. Please try again.");
      publishingLock.current = false;
    } finally {
      setIsPublishing(false);
    }
  };

  const scanStages = [
    { text: "Fetching profile & recent posts", at: 12 },
    { text: "Analysing visual style & brand tone", at: 55 },
    { text: "Estimating audience & tier", at: 95 },
    { text: "Drafting your profile", at: 128 },
  ];

  const getScanLog = () => {
    let activeFound = false;
    return scanStages.map((stage) => {
      const done = scanned >= stage.at;
      const isActive = !done && !activeFound;
      if (isActive) activeFound = true;
      return { ...stage, done, isActive };
    });
  };

  return (
    <div className="grid h-full min-h-[100dvh] w-full grid-cols-1 overflow-auto md:h-screen md:grid-cols-[min(400px,36vw)_minmax(0,1fr)] md:overflow-hidden">
      <aside className="relative hidden overflow-hidden bg-gray-50 md:flex md:flex-col">
        <img
          src="/onboarding/22-fashionos.jpeg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/55 to-gray-900/78" />
        <div className="relative flex h-full flex-col p-8 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-gray-900">
              iP
            </div>
            <span className="text-base font-semibold">FashionOS</span>
          </div>
          <div className="mt-11">
            <h1 className="text-3xl font-bold leading-tight tracking-tight">Build your talent profile</h1>
            <p className="mt-3 max-w-[290px] text-sm leading-relaxed text-white/82">
              Paste one link. Our AI drafts your profile — you review every field before it goes live.
            </p>
          </div>
          <WizardStep steps={steps} currentStep={step} />
          <div className="flex-1" />
          <div className="text-xs text-white/55">Nothing is published until you approve it.</div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-col bg-white">
        {step === 1 && (
          <div className="flex flex-1 items-center justify-center p-4 md:p-10">
            <div className="w-full max-w-[420px]">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Step 1 of 4</div>
              <h2 className="mb-1 mt-2 text-2xl font-bold tracking-tight">Connect your profile</h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-600">
                Paste your Instagram or portfolio link. Our AI will read your content and draft a profile.
              </p>
              {analysisError && (
                <div className="mb-4">
                  <ErrorState
                    title="Couldn't analyse profile"
                    message={analysisError}
                    onRetry={handleAnalyse}
                    retryLabel="Retry analysis"
                  />
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-900">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-900">Instagram or portfolio URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <Button size="sm" disabled={!name || !url || isAnalyzing} onClick={handleAnalyse} className="w-full">
                  {isAnalyzing ? "Analysing..." : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyse profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-1 items-center justify-center p-4 md:p-10">
            <div className="w-full max-w-[460px]">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Step 2 of 4</div>
              <h2 className="mb-1 mt-2 text-2xl font-bold tracking-tight">
                Analysing your content<span className="animate-pulse">▍</span>
              </h2>
              <p className="mb-5 text-sm text-gray-600">
                <span className="font-mono">{scanned}</span> / 128 recent posts analysed
              </p>
              <div className="mb-5 flex flex-col gap-0.5">
                {getScanLog().map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2">
                    <div
                      className={`h-4 w-4 flex-shrink-0 rounded-full ${
                        stage.done ? "bg-green-600" : stage.isActive ? "animate-pulse bg-yellow-500" : "bg-gray-400 opacity-50"
                      }`}
                    />
                    <span className={`text-sm ${stage.done || stage.isActive ? "text-gray-900" : "text-gray-500"} ${stage.isActive ? "font-medium" : ""}`}>
                      {stage.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    className="h-18 w-14 overflow-hidden rounded-lg border border-gray-300 bg-gray-100 transition-opacity"
                    style={{ opacity: scanned > idx * 26 ? 1 : 0.25 }}
                  >
                    <img
                      src={`/onboarding/${11 + idx}-fashionos.jpeg`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <>
            <div className="flex-1 overflow-y-auto p-4 pb-5 md:p-9">
              <div className="mx-auto max-w-[540px]">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Step 3 of 4</div>
                <h2 className="mb-1 mt-2 text-2xl font-bold tracking-tight">Review your drafted profile</h2>
                <p className="mb-6 text-sm leading-relaxed text-gray-600">
                  Our AI drafted each field below. <strong className="text-gray-900">Approve</strong> or <strong className="text-gray-900">edit</strong> every one — nothing saves until all are reviewed.
                </p>
                {publishError && (
                  <div className="mb-4">
                    <ErrorState
                      title="Publish failed"
                      message={publishError}
                      onRetry={handleFinishPublish}
                      retryLabel="Retry publish"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {fields.map((field, idx) => (
                    <ApprovalCard
                      key={field.key}
                      label={field.label}
                      value={field.value}
                      draft={field.draft}
                      isEditing={field.editing}
                      status={field.status}
                      confidence={field.confidence}
                      evidence={field.evidence}
                      evidenceOpen={field.evidenceOpen}
                      onApprove={() => updateField(idx, { status: "approved", evidenceOpen: false })}
                      onEdit={() => updateField(idx, { editing: true, draft: field.value })}
                      onSave={() => updateField(idx, { editing: false, value: field.draft, status: "edited" })}
                      onCancel={() => updateField(idx, { editing: false })}
                      onWhy={() => updateField(idx, { evidenceOpen: !field.evidenceOpen })}
                      onDraftChange={(val) => updateField(idx, { draft: val })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-300 bg-white p-4">
              <div className="mx-auto flex max-w-[540px] flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-mono font-semibold text-gray-900">{reviewedCount}</span> of {fields.length} fields reviewed
                  </div>
                  <div className="mt-2 h-1.5 max-w-[220px] overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full bg-green-600 transition-all duration-300"
                      style={{ width: `${Math.round((reviewedCount / fields.length) * 100)}%` }}
                    />
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  size="sm"
                  disabled={!allReviewed || isPublishing}
                  onClick={handleFinishPublish}
                >
                  {isPublishing ? "Publishing..." : allReviewed ? (
                    <>
                      <Check className="h-4 w-4" />
                      Finish & publish
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Review all to finish
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <div className="flex flex-1 items-center justify-center p-4 md:p-10">
            <div className="w-full max-w-[420px] text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-600">
                <Check className="h-7 w-7 text-white" />
              </div>
              <h2 className="mb-2 text-2xl font-bold tracking-tight">Your profile is live</h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-600">
                Every field was reviewed by you. Brands searching for talent can now discover you.
              </p>
              <Link
                href={createdProfileId ? `/app/talent/profile?talentId=${createdProfileId}` : "/app/talent/profile"}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
              >
                <User className="h-4 w-4" />
                View my profile
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
