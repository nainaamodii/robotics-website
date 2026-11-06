// Adjust this import if your MongoDB singleton lives at a different path.
import { getDB } from "@/lib/db";

const COLLECTION = "admin_chat_threads";

// ============================================================================
// Types
// ============================================================================

export interface HitlSnapshot {
  status: "pending" | "approved" | "rejected";
  type: "gmail" | "github";
  action: string;
  fields: Record<string, unknown>;
  // The LangGraph checkpointer's per-turn execution thread id — distinct
  // from ChatThread.threadId (the UI conversation id). Required to resume
  // this specific paused turn later; see graph.ts / resume/route.ts.
  execThreadId: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  hitl?: HitlSnapshot;
}

export interface ChatThread {
  threadId: string;
  adminId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ThreadSummary {
  threadId: string;
  title: string;
  updatedAt: string;
}

// ============================================================================
// Operations
// ============================================================================

export async function createThread(adminId: string, threadId: string): Promise<ChatThread> {
  const db = await getDB();
  const now = new Date().toISOString();
  const thread: ChatThread = {
    threadId,
    adminId,
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  await db.collection<ChatThread>(COLLECTION).insertOne(thread);
  return thread;
}

export async function listThreads(adminId: string): Promise<ThreadSummary[]> {
  const db = await getDB();
  const docs = await db
    .collection<ChatThread>(COLLECTION)
    .find({ adminId }, { projection: { threadId: 1, title: 1, updatedAt: 1, _id: 0 } })
    .sort({ updatedAt: -1 })
    .toArray();
  return docs as unknown as ThreadSummary[];
}

export async function getThread(threadId: string): Promise<ChatThread | null> {
  const db = await getDB();
  const doc = await db.collection<ChatThread>(COLLECTION).findOne({ threadId }, { projection: { _id: 0 } });
  return doc as ChatThread | null;
}

/**
 * Appends a message to a thread, creating the thread doc if it doesn't exist
 * yet (upsert), and sets the title from `titleHint` the first time a real
 * title is available (keeps "New chat" until the first user message lands).
 */
export async function appendMessage(
  adminId: string,
  threadId: string,
  message: ChatMessage,
  titleHint?: string
): Promise<void> {
  const db = await getDB();
  const existing = await db.collection<ChatThread>(COLLECTION).findOne({ threadId }, { projection: { title: 1 } });
  const now = new Date().toISOString();

  if (!existing) {
    await db.collection<ChatThread>(COLLECTION).insertOne({
      threadId,
      adminId,
      title: titleHint ? titleHint.slice(0, 60) : "New chat",
      createdAt: now,
      updatedAt: now,
      messages: [message],
    });
    return;
  }

  const setFields: Record<string, unknown> = { updatedAt: now };
  if (titleHint && existing.title === "New chat") setFields.title = titleHint.slice(0, 60);

  await db
    .collection<ChatThread>(COLLECTION)
    .updateOne({ threadId }, { $push: { messages: message }, $set: setFields });
}

/**
 * Replaces the last message in a thread — used to flip a "pending" HITL
 * message into "approved"/"rejected" in place once the admin decides,
 * instead of appending a duplicate.
 */
export async function updateLastMessage(threadId: string, message: ChatMessage): Promise<void> {
  const db = await getDB();
  const thread = await db.collection<ChatThread>(COLLECTION).findOne({ threadId }, { projection: { messages: 1 } });
  if (!thread || thread.messages.length === 0) return;
  const idx = thread.messages.length - 1;
  await db
    .collection<ChatThread>(COLLECTION)
    .updateOne(
      { threadId },
      { $set: { [`messages.${idx}`]: message, updatedAt: new Date().toISOString() } }
    );
}

export async function deleteThread(threadId: string): Promise<void> {
  const db = await getDB();
  await db.collection<ChatThread>(COLLECTION).deleteOne({ threadId });
}