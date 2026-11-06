"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, GitPullRequest, Check, X } from "lucide-react";
import type { HitlSnapshot } from "./useAdminChat";

interface HitlCardProps {
  hitl: HitlSnapshot;
  disabled?: boolean;
  onApprove: (fields: Record<string, unknown>) => void;
  onReject: () => void;
}

export function HitlCard({ hitl, disabled, onApprove, onReject }: HitlCardProps) {
  const isGmail = hitl.type === "gmail";
  const isResolved = hitl.status !== "pending";

  const [fields, setFields] = useState<Record<string, string>>(() => {
    const f = (hitl.fields ?? {}) as Record<string, unknown>;
    const result: Record<string, string> = {};
    if (isGmail) {
      result.to = (f.to as string) ?? "";
      result.subject = (f.subject as string) ?? "";
      result.body = (f.body as string) ?? "";
    } else {
      result.title = (f.title as string) ?? "";
      result.body = (f.body as string) ?? "";
      result.repo = (f.repo as string) ?? "";
    }
    return result;
  });

  const update = (key: string, value: string) => setFields((prev) => ({ ...prev, [key]: value }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        {isGmail ? <Mail size={16} className="text-[var(--fg-secondary)]" /> : <GitPullRequest size={16} className="text-[var(--fg-secondary)]" />}
        <span className="text-sm font-medium text-[var(--fg)]">
          {isGmail ? "Confirm email" : `Confirm GitHub action`}
        </span>
        <span className="text-xs text-[var(--fg-tertiary)] ml-auto uppercase tracking-wide">{hitl.action}</span>
      </div>

      <div className="px-4 py-4 space-y-3">
        {isGmail ? (
          <>
            <Field label="To" value={fields.to} onChange={(v) => update("to", v)} disabled={isResolved || disabled} />
            <Field label="Subject" value={fields.subject} onChange={(v) => update("subject", v)} disabled={isResolved || disabled} />
            <Field
              label="Body"
              value={fields.body}
              onChange={(v) => update("body", v)}
              disabled={isResolved || disabled}
              multiline
            />
          </>
        ) : (
          <>
            {fields.repo && <Field label="Repo" value={fields.repo} onChange={(v) => update("repo", v)} disabled />}
            <Field label="Title" value={fields.title} onChange={(v) => update("title", v)} disabled={isResolved || disabled} />
            <Field
              label="Body"
              value={fields.body}
              onChange={(v) => update("body", v)}
              disabled={isResolved || disabled}
              multiline
            />
          </>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border)] bg-[var(--bg)]">
        {isResolved ? (
          <span
            className={`text-xs font-medium px-3 py-1.5 rounded-full ${
              hitl.status === "approved"
                ? "bg-green-500/10 text-green-500"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {hitl.status === "approved" ? "Approved & sent" : "Rejected"}
          </span>
        ) : (
          <>
            <button
              onClick={() => onApprove({ approved: true, ...fields })}
              disabled={disabled}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Check size={14} /> Approve
            </button>
            <button
              onClick={onReject}
              disabled={disabled}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[var(--border-hover)] transition-colors disabled:opacity-50"
            >
              <X size={14} /> Reject
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--fg-tertiary)] mb-1">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] resize-y disabled:opacity-60 focus:outline-none focus:border-[var(--border-hover)]"
        />
      ) : (
        <input
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] disabled:opacity-60 focus:outline-none focus:border-[var(--border-hover)]"
        />
      )}
    </label>
  );
}
