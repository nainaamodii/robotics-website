"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const ADMIN_ID = "admin"; // single shared admin — swap for real session id when auth is wired in

export interface HitlSnapshot {
  status: "pending" | "approved" | "rejected";
  type: "gmail" | "github";
  action: string;
  fields: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  hitl?: HitlSnapshot;
  streaming?: boolean; // client-only flag for the in-progress assistant bubble
}

export interface ThreadSummary {
  threadId: string;
  title: string;
  updatedAt: string;
}

// ============================================================================
// SSE parsing helper — fetch()-based since EventSource can't send a POST body
// ============================================================================

async function consumeSSE(
  response: Response,
  onEvent: (event: string, data: any) => void
): Promise<void> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      if (!frame.trim()) continue;
      let event = "message";
      let data = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7).trim();
        else if (line.startsWith("data: ")) data += line.slice(6);
      }
      try {
        onEvent(event, data ? JSON.parse(data) : null);
      } catch {
        onEvent(event, data);
      }
    }
  }
}

// ============================================================================
// Conversation history — builds the "user: ..." / "assistant: ..." line
// format that planning.ts and workers/conversational.ts parse on the server.
// Without this, the model gets zero visibility into anything said earlier in
// the conversation, which produces confidently-wrong answers to follow-up
// questions ("you showed me X before" when the model never received X).
// ============================================================================

function buildHistoryLines(messages: ChatMessage[]): string[] {
  return messages
    .filter((m) => !m.streaming && m.content.trim() && (m.role === "user" || m.role === "assistant"))
    .map((m) => `${m.role}: ${m.content}`);
}

// ============================================================================
// Hook
// ============================================================================

export function useAdminChat() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const pendingHitlRef = useRef<HitlSnapshot | null>(null);

  const refreshThreads = useCallback(async () => {
    const res = await fetch(`/api/admin/agent/threads?adminId=${ADMIN_ID}`);
    if (!res.ok) return;
    const { threads } = await res.json();
    setThreads(threads ?? []);
  }, []);

  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  const startNewChat = useCallback(() => {
    setActiveThreadId(null);
    setMessages([]);
    pendingHitlRef.current = null;
  }, []);

  const selectThread = useCallback(async (threadId: string) => {
    setIsLoadingThread(true);
    setActiveThreadId(threadId);
    try {
      const res = await fetch(`/api/admin/agent/threads/${threadId}`);
      if (!res.ok) {
        setMessages([]);
        return;
      }
      const { thread } = await res.json();
      setMessages(thread?.messages ?? []);
      const last = thread?.messages?.[thread.messages.length - 1];
      pendingHitlRef.current = last?.hitl?.status === "pending" ? last.hitl : null;
    } finally {
      setIsLoadingThread(false);
    }
  }, []);

  const appendLocal = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateStreamingBubble = useCallback((delta: string) => {
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.streaming) {
        copy[copy.length - 1] = { ...last, content: last.content + delta };
      }
      return copy;
    });
  }, []);

  const finalizeStreamingBubble = useCallback((finalContent?: string, hitl?: HitlSnapshot) => {
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.streaming) {
        copy[copy.length - 1] = {
          ...last,
          streaming: false,
          content: finalContent ?? last.content,
          hitl,
        };
      }
      return copy;
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isSending) return;
      setIsSending(true);

      // Snapshot history BEFORE appending this turn's new bubbles — the
      // server should only see what was actually said in prior turns.
      const conversationHistory = buildHistoryLines(messages);

      appendLocal({ id: crypto.randomUUID(), role: "user", content: text, createdAt: new Date().toISOString() });
      appendLocal({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        streaming: true,
      });

      try {
        const res = await fetch("/api/admin/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userQuery: text,
            adminId: ADMIN_ID,
            threadId: activeThreadId ?? undefined,
            conversationHistory,
          }),
        });

        await consumeSSE(res, (event, data) => {
          if (event === "thread") {
            if (!activeThreadId) {
              setActiveThreadId(data.threadId);
              refreshThreads();
            }
          } else if (event === "token") {
            updateStreamingBubble(data.text);
          } else if (event === "interrupt") {
            const hitl: HitlSnapshot = {
              status: "pending",
              type: data.confirmationRequired?.type,
              action: data.confirmationRequired?.action,
              fields: data.confirmationRequired,
            };
            pendingHitlRef.current = hitl;
            finalizeStreamingBubble(undefined, hitl);
            refreshThreads();
          } else if (event === "done") {
            finalizeStreamingBubble(data.response);
            refreshThreads();
          } else if (event === "error") {
            finalizeStreamingBubble(`Something went wrong: ${data?.message ?? "unknown error"}`);
          }
        });
      } finally {
        setIsSending(false);
      }
    },
    [activeThreadId, appendLocal, finalizeStreamingBubble, isSending, messages, refreshThreads, updateStreamingBubble]
  );

  const resolveHitl = useCallback(
    async (decision: "reject" | Record<string, unknown>) => {
      if (!activeThreadId || isSending) return;
      setIsSending(true);
      pendingHitlRef.current = null;

      appendLocal({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        streaming: true,
      });

      try {
        const res = await fetch("/api/admin/agent/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: activeThreadId, decision, adminId: ADMIN_ID }),
        });

        await consumeSSE(res, (event, data) => {
          if (event === "token") {
            updateStreamingBubble(data.text);
          } else if (event === "interrupt") {
            const hitl: HitlSnapshot = {
              status: "pending",
              type: data.confirmationRequired?.type,
              action: data.confirmationRequired?.action,
              fields: data.confirmationRequired,
            };
            pendingHitlRef.current = hitl;
            finalizeStreamingBubble(undefined, hitl);
          } else if (event === "done") {
            finalizeStreamingBubble(data.response);
            refreshThreads();
          } else if (event === "error") {
            finalizeStreamingBubble(`Something went wrong: ${data?.message ?? "unknown error"}`);
          }
        });
      } finally {
        setIsSending(false);
      }
    },
    [activeThreadId, appendLocal, finalizeStreamingBubble, isSending, refreshThreads, updateStreamingBubble]
  );

  return {
    threads,
    activeThreadId,
    messages,
    isSending,
    isLoadingThread,
    startNewChat,
    selectThread,
    sendMessage,
    resolveHitl,
    pendingHitl: pendingHitlRef.current,
  };
}