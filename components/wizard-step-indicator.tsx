"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"

interface Props {
  steps: string[]
  currentStep: number
}

export default function WizardStepIndicator({ steps, currentStep }: Props) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto mb-10">
      {steps.map((label, idx) => {
        const isActive = idx === currentStep
        const isComplete = idx < currentStep
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  borderColor: isActive
                    ? "var(--accent-primary)"
                    : isComplete
                    ? "var(--accent-primary)"
                    : "var(--border-subtle)",
                }}
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-colors ${
                  isComplete
                    ? "bg-[var(--accent-primary)] text-black"
                    : isActive
                    ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                    : "bg-[var(--bg-elevated)] text-[var(--text-dim)]"
                }`}
              >
                {isComplete ? <Check className="w-4 h-4" /> : idx + 1}
              </motion.div>
              <span className={`text-[10px] mt-2 text-center whitespace-nowrap ${
                isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-dim)]"
              }`}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 mt-[-16px] ${
                idx < currentStep ? "bg-[var(--accent-primary)]" : "bg-[var(--border-subtle)]"
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
