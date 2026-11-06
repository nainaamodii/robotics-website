"use client";

import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType, HitlSnapshot } from "./useAdminChat";
import { HitlCard } from "./HitlCard";

interface ChatMessageProps {
  message: ChatMessageType;
  isSending: boolean;
  onApproveHitl: (fields: Record<string, unknown>) => void;
  onRejectHitl: () => void;
}

export function ChatMessage({ message, isSending, onApproveHitl, onRejectHitl }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-[var(--fg)] text-[var(--bg)]" : "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--fg-secondary)]"
        }`}
      >
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-[var(--fg)] text-[var(--bg)]"
              : "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--fg)]"
          }`}
        >
          {message.content || (message.streaming ? <TypingDots /> : "")}
        </div>

        {message.hitl && (
          <div className="w-full">
            <HitlCard
              hitl={message.hitl as HitlSnapshot}
              disabled={isSending}
              onApprove={onApproveHitl}
              onReject={onRejectHitl}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[var(--fg-tertiary)]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}
