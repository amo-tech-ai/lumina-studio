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
    <nav aria-label="Wizard steps" className="mt-10">
      <ol className="flex flex-col gap-2">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum;
          const isActive = currentStep === stepNum;
          const stateName = isDone ? "completed" : isActive ? "active" : "future";

          const dotStyle: CSSProperties = {
            width: 30,
            height: 30,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            ...(isDone
              ? { background: "var(--color-dna-high)", color: "#fff" }
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
            <li
              key={step.label}
              className="flex items-center gap-3 py-2"
              data-state={stateName}
              aria-current={isActive ? "step" : undefined}
            >
              {isDone ? <span className="sr-only">Completed</span> : null}
              <div style={dotStyle} aria-hidden>
                <step.icon style={{ width: 14, height: 14 }} />
              </div>
              <div>
                <div style={labelStyle}>{step.label}</div>
                <div className="text-xs text-white/60">{step.sub}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
