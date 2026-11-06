"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMessage } from "./ChatMessage";
import { useAdminChat } from "./useAdminChat";

export function ChatPanel() {
  const {
    threads,
    activeThreadId,
    messages,
    isSending,
    isLoadingThread,
    startNewChat,
    selectThread,
    sendMessage,
    resolveHitl,
    pendingHitl,
  } = useAdminChat();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isSending || pendingHitl) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-96px)] border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--bg)]">
      <ChatSidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onNewChat={startNewChat}
        onSelectThread={selectThread}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {isLoadingThread ? (
            <p className="text-sm text-[var(--fg-tertiary)]">Loading conversation…</p>
          ) : messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                isSending={isSending}
                onApproveHitl={(fields) => resolveHitl(fields)}
                onRejectHitl={() => resolveHitl("reject")}
              />
            ))
          )}
        </div>

        <div className="border-t border-[var(--border)] p-4">
          {pendingHitl && (
            <p className="text-xs text-[var(--fg-tertiary)] mb-2">
              Resolve the pending confirmation above before sending a new message.
            </p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={!!pendingHitl}
              placeholder={pendingHitl ? "Resolve the pending action above…" : "Ask the admin assistant anything…"}
              rows={1}
              className="flex-1 resize-none rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-tertiary)] focus:outline-none focus:border-[var(--border-hover)] disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending || !!pendingHitl}
              className="shrink-0 w-11 h-11 rounded-full bg-[var(--fg)] text-[var(--bg)] flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6">
      <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mb-4">
        <MessageCircle size={20} className="text-[var(--fg-tertiary)]" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--fg)] mb-1">Admin Assistant</h3>
      <p className="text-sm text-[var(--fg-secondary)] max-w-sm">
        Ask about projects, teams, or requests — or ask it to draft an email or open a GitHub issue.
        Anything that sends or writes something will ask for your approval first.
      </p>
    </div>
  );
}
