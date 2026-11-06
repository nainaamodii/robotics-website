"use client";

import { Plus, MessageSquare } from "lucide-react";
import type { ThreadSummary } from "./useAdminChat";

interface ChatSidebarProps {
  threads: ThreadSummary[];
  activeThreadId: string | null;
  onNewChat: () => void;
  onSelectThread: (threadId: string) => void;
}

export function ChatSidebar({ threads, activeThreadId, onNewChat, onSelectThread }: ChatSidebarProps) {
  return (
    <aside className="w-72 shrink-0 h-full border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col">
      <div className="p-3 border-b border-[var(--border)]">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {threads.length === 0 && (
          <p className="text-xs text-[var(--fg-tertiary)] text-center py-8 px-4">
            No conversations yet. Start a new chat to get going.
          </p>
        )}

        {threads.map((thread) => {
          const isActive = thread.threadId === activeThreadId;
          return (
            <button
              key={thread.threadId}
              onClick={() => onSelectThread(thread.threadId)}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-2 transition-colors ${
                isActive ? "bg-[var(--bg)] border border-[var(--border-hover)]" : "hover:bg-[var(--bg)]/60 border border-transparent"
              }`}
            >
              <MessageSquare size={14} className="mt-0.5 shrink-0 text-[var(--fg-tertiary)]" />
              <span className="min-w-0">
                <span className="block text-sm text-[var(--fg)] truncate">{thread.title}</span>
                <span className="block text-xs text-[var(--fg-tertiary)] mt-0.5">{relativeTime(thread.updatedAt)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
