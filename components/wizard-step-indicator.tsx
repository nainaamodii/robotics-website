"use client"

import { Check } from "lucide-react"

interface Props {
  steps: string[]
  currentStep: number
}

/** Horizontal "T-minus" style progress: numbered ticks joined by a hairline. */
export default function WizardStepIndicator({ steps, currentStep }: Props) {
  return (
    <ol className="flex items-center w-full mb-10" aria-label="Registration progress">
      {steps.map((label, idx) => {
        const done = idx < currentStep
        const active = idx === currentStep
        return (
          <li key={label} className="flex items-center flex-1 last:flex-none" aria-current={active ? "step" : undefined}>
            <div className="flex items-center gap-3">
              <span
                className={`w-7 h-7 border flex items-center justify-center text-[11px] font-mono transition-colors ${
                  done ? "bg-white text-black border-white" : active ? "border-white text-white" : "border-[var(--border)] text-[var(--fg-tertiary)]"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : String(idx + 1).padStart(2, "0")}
              </span>
              <span className={`realm-eyebrow !text-[10px] hidden sm:block ${active ? "!text-white" : ""}`}>{label}</span>
            </div>
            {idx < steps.length - 1 && <span className={`flex-1 h-px mx-4 ${done ? "bg-white" : "bg-[var(--border)]"}`} />}
          </li>
        )
      })}
    </ol>
  )
}
