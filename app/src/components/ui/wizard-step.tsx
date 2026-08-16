import type { CSSProperties } from "react";
import { LucideIcon } from "lucide-react";

export interface WizardStepMeta {
  icon: LucideIcon;
  label: string;
  sub: string;
}

export interface WizardStepProps {
  steps: WizardStepMeta[];
  currentStep: number;
}

export function WizardStep({ steps, currentStep }: WizardStepProps) {
  return (
    <div className="flex flex-col gap-2 mt-10">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isDone = currentStep > stepNum;
        const isActive = currentStep === stepNum;

        const dotStyle: CSSProperties = {
          width: 30,
          height: 30,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          ...(isDone
            ? { background: "var(--dna-high)", color: "#fff" }
            : isActive
              ? { background: "#fff", color: "#111" }
              : { background: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.7)" }),
        };

        const labelStyle: CSSProperties = {
          fontSize: 14,
          fontWeight: 600,
          color: isActive || isDone ? "#fff" : "rgba(255,255,255,0.7)",
        };

        return (
          <div key={idx} className="flex items-center gap-3 py-2">
            <div style={dotStyle}>
              <step.icon style={{ width: 14, height: 14 }} />
            </div>
            <div>
              <div style={labelStyle}>{step.label}</div>
              <div className="text-xs text-white/60">{step.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
