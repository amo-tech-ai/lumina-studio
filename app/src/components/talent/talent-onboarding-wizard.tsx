"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Link as LinkIcon, Sparkles, ListChecks, Check, User } from "lucide-react";
import { WizardStep, type WizardStepMeta } from "@/components/ui/wizard-step";
import { ApprovalCard } from "@/components/ui/approval-card";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/lib/auth-client";

type Step = 1 | 2 | 3 | 4;

interface AnalyzedField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  evidence: string;
}

interface Field {
  key: string;
  label: string;
  value: string;
  draft: string;
  status: 'ai' | 'approved' | 'edited';
  confidence: number;
  evidence: string;
  editing: boolean;
  evidenceOpen: boolean;
}

export function TalentOnboardingWizard() {
  const { user, loading: authLoading } = useAuthUser();
  const [step, setStep] = useState<Step>(1);
  const [scanned, setScanned] = useState(0);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null);
  const [analysisRequestId, setAnalysisRequestId] = useState(0);
  const [fields, setFields] = useState<Field[]>([
    { key: 'name', label: 'Full name', value: '', draft: '', status: 'ai', confidence: 0, evidence: '', editing: false, evidenceOpen: false },
    { key: 'handle', label: 'Handle', value: '', draft: '', status: 'ai', confidence: 0, evidence: '', editing: false, evidenceOpen: false },
    { key: 'niche', label: 'Niche', value: '', draft: '', status: 'ai', confidence: 0, evidence: '', editing: false, evidenceOpen: false },
    { key: 'tier', label: 'Tier', value: '', draft: '', status: 'ai', confidence: 0, evidence: '', editing: false, evidenceOpen: false },
    { key: 'loc', label: 'Location', value: '', draft: '', status: 'ai', confidence: 0, evidence: '', editing: false, evidenceOpen: false },
    { key: 'rate', label: 'Suggested day rate', value: '', draft: '', status: 'ai', confidence: 0, evidence: '', editing: false, evidenceOpen: false },
    { key: 'bio', label: 'Short bio', value: '', draft: '', status: 'ai', confidence: 0, evidence: '', editing: false, evidenceOpen: false },
  ]);

  const steps: WizardStepMeta[] = [
    { icon: LinkIcon, label: 'Connect', sub: 'Paste your link' },
    { icon: Sparkles, label: 'Analyse', sub: 'AI reads your content' },
    { icon: ListChecks, label: 'Review', sub: 'Approve every field' },
    { icon: Check, label: 'Go live', sub: 'Publish your profile' },
  ];

  // Scan animation for Step 2
  useEffect(() => {
    if (step === 2) {
      setScanned(0);
      const timer = setInterval(() => {
        setScanned(prev => {
          const next = Math.min(128, prev + 9);
          if (next >= 128) {
            clearInterval(timer);
            setTimeout(() => setStep(3), 550);
          }
          return next;
        });
      }, 130);
      return () => clearInterval(timer);
    }
  }, [step]);

  const handleAnalyse = async () => {
    if (!name || !url) return;
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    // Increment request ID to track this specific analysis
    const currentRequestId = analysisRequestId + 1;
    setAnalysisRequestId(currentRequestId);
    
    try {
      const response = await fetch('/api/talent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url }),
      });
      
      const data = await response.json();
      
      // Only update if this is still the latest request
      if (currentRequestId === analysisRequestId) {
        if (data.success && data.fields) {
          setFields(prev => prev.map(field => {
            const analyzed = data.fields.find((f: AnalyzedField) => f.key === field.key);
            return analyzed ? { ...field, value: analyzed.value, confidence: analyzed.confidence, evidence: analyzed.evidence } : field;
          }));
          setStep(2);
        } else {
          setAnalysisError(data.error || 'Analysis failed');
        }
      }
    } catch (error) {
      if (currentRequestId === analysisRequestId) {
        setAnalysisError('Failed to analyze profile. Please try again.');
      }
    } finally {
      if (currentRequestId === analysisRequestId) {
        setIsAnalyzing(false);
      }
    }
  };

  const updateField = (index: number, patch: Partial<Field>) => {
    setFields(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...patch };
      return updated;
    });
  };

  const reviewedCount = fields.filter(f => f.status !== 'ai').length;
  const allReviewed = reviewedCount === fields.length;

  const handleFinishPublish = async () => {
    if (!allReviewed || isPublishing) return;
    
    setIsPublishing(true);
    
    try {
      const response = await fetch('/api/talent/profile-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: fields.find(f => f.key === 'name')?.value || name,
          bio: fields.find(f => f.key === 'bio')?.value,
          handle: fields.find(f => f.key === 'handle')?.value,
          niche: fields.find(f => f.key === 'niche')?.value,
          tier: fields.find(f => f.key === 'tier')?.value,
          location: fields.find(f => f.key === 'loc')?.value,
          dayRate: fields.find(f => f.key === 'rate')?.value,
          languages: [],
          sourceUrl: url,
          profileId: user?.id,
          agencyOrgId: undefined,
          analyzedFields: fields.map(f => ({
            key: f.key,
            value: f.value,
            confidence: f.confidence,
            evidence: f.evidence,
          })),
        }),
      });

      const data = await response.json();

      if (data.success && data.profile) {
        setCreatedProfileId(data.profile.id);
        setStep(4);
      }
    } catch (error) {
      console.error('Profile creation error:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const scanStages = [
    { text: 'Fetching profile & recent posts', at: 12 },
    { text: 'Analysing visual style & brand tone', at: 55 },
    { text: 'Estimating audience & tier', at: 95 },
    { text: 'Drafting your profile', at: 128 },
  ];

  const getScanLog = () => {
    let activeFound = false;
    return scanStages.map(stage => {
      const done = scanned >= stage.at;
      const isActive = !done && !activeFound;
      if (isActive) activeFound = true;
      return { ...stage, done, isActive };
    });
  };

  return (
    <div className="grid grid-cols-[400px_minmax(0,1fr)] h-screen w-screen overflow-hidden">
      {/* Left sidebar */}
      <aside className="relative overflow-hidden bg-gray-50">
        <img 
          src="/images/22-fashionos.jpeg" 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/55 to-gray-900/78" />
        <div className="relative h-full flex flex-col p-8 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white text-gray-900 flex items-center justify-center font-bold text-sm">
              iP
            </div>
            <span className="font-semibold text-base">FashionOS</span>
          </div>
          <div className="mt-11">
            <h1 className="text-3xl font-bold tracking-tight leading-tight">Build your talent profile</h1>
            <p className="mt-3 text-sm text-white/82 leading-relaxed max-w-[290px]">
              Paste one link. Our AI drafts your profile — you review every field before it goes live.
            </p>
          </div>
          <WizardStep steps={steps} currentStep={step} />
          <div className="flex-1" />
          <div className="text-xs text-white/55">Nothing is published until you approve it.</div>
        </div>
      </aside>

      {/* Right content */}
      <main className="flex flex-col min-w-0 bg-white">
        {/* Step 1: Connect */}
        {step === 1 && (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="w-full max-w-[420px]">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step 1 of 4</div>
              <h2 className="mt-2 mb-1 text-2xl font-bold tracking-tight">Connect your profile</h2>
              <p className="mb-6 text-sm text-gray-600 leading-relaxed">
                Paste your Instagram or portfolio link. Our AI will read your content and draft a profile.
              </p>
              {analysisError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {analysisError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Instagram or portfolio URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <Button
                  size="sm"
                  disabled={!name || !url || isAnalyzing}
                  onClick={handleAnalyse}
                  className="w-full"
                >
                  {isAnalyzing ? 'Analysing...' : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyse profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Analysing */}
        {step === 2 && (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="w-full max-w-[460px]">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step 2 of 4</div>
              <h2 className="mt-2 mb-1 text-2xl font-bold tracking-tight">
                Analysing your content<span className="animate-pulse">▍</span>
              </h2>
              <p className="mb-5 text-sm text-gray-600">
                <span className="font-mono">{scanned}</span> / 128 recent posts analysed
              </p>
              <div className="flex flex-col gap-0.5 mb-5">
                {getScanLog().map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2">
                    <div
                      className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
                        stage.done ? 'bg-green-600' : stage.isActive ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400 opacity-50'
                      }`}
                    />
                    <span className={`text-sm ${stage.done || stage.isActive ? 'text-gray-900' : 'text-gray-500'} ${stage.isActive ? 'font-medium' : ''}`}>
                      {stage.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map(idx => (
                  <div
                    key={idx}
                    className="w-14 h-18 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 transition-opacity"
                    style={{ opacity: scanned > idx * 26 ? 1 : 0.25 }}
                  >
                    <img
                      src={`/images/${11 + idx}-fashionos.jpeg`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <>
            <div className="flex-1 overflow-y-auto p-9 pb-5">
              <div className="max-w-[540px] mx-auto">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step 3 of 4</div>
                <h2 className="mt-2 mb-1 text-2xl font-bold tracking-tight">Review your drafted profile</h2>
                <p className="mb-6 text-sm text-gray-600 leading-relaxed">
                  Our AI drafted each field below. <strong className="text-gray-900">Approve</strong> or <strong className="text-gray-900">edit</strong> every one — nothing saves until all are reviewed.
                </p>
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
                      onApprove={() => updateField(idx, { status: 'approved', evidenceOpen: false })}
                      onEdit={() => updateField(idx, { editing: true, draft: field.value })}
                      onSave={() => updateField(idx, { editing: false, value: field.draft, status: 'edited' })}
                      onCancel={() => updateField(idx, { editing: false })}
                      onWhy={() => updateField(idx, { evidenceOpen: !field.evidenceOpen })}
                      onDraftChange={(val) => updateField(idx, { draft: val })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-300 bg-white p-4">
              <div className="max-w-[540px] mx-auto flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-mono font-semibold text-gray-900">{reviewedCount}</span> of {fields.length} fields reviewed
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-2 max-w-[220px]">
                    <div 
                      className="h-full bg-green-600 transition-all duration-300"
                      style={{ width: `${Math.round(reviewedCount / fields.length * 100)}%` }}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  disabled={!allReviewed || isPublishing}
                  onClick={handleFinishPublish}
                  className={!allReviewed ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}
                >
                  {isPublishing ? (
                    'Publishing...'
                  ) : allReviewed ? (
                    <>
                      <Check className="w-4 h-4" />
                      Finish & publish
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Review all to finish
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="w-full max-w-[420px] text-center">
              <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-5">
                <Check className="w-7 h-7 text-white" />
              </div>
              <h2 className="mb-2 text-2xl font-bold tracking-tight">Your profile is live</h2>
              <p className="mb-6 text-sm text-gray-600 leading-relaxed">
                Every field was reviewed by you. Brands searching for talent can now discover you.
              </p>
              <Link
                href={createdProfileId ? `/app/talent/profile?talentId=${createdProfileId}` : "/app/talent/profile"}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gray-900 text-white text-sm font-semibold"
              >
                <User className="w-4 h-4" />
                View my profile
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
