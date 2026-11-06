import { interrupt } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { WorkerTask, PendingApproval, TaskResult } from "./types";

// Cheap/fast model for field-drafting — doesn't need to be the planning model.
const draftModel = new ChatGoogleGenerativeAI({
  model: process.env.ADMIN_AGENT_DRAFT_MODEL ?? "gemini-3.6-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.2,
});

// ============================================================================
// READ vs WRITE detection
// ============================================================================

// Exactly the actions workers/github.ts and workers/gmail.ts implement —
// kept in sync with the zod enum in types.ts. Every task's action is now
// guaranteed to be one of these (or the gmail default), so unlike before,
// there's no "unknown action" case left to handle here with a fuzzy
// text-signal fallback. That fallback used to false-positive on things like
// "list OPEN pull requests" (the word "open" matched a write-signal meant
// for "open an issue") — removing it removes that whole bug class, not just
// the one instance of it.
const WRITE_GITHUB_ACTIONS = new Set(["create_issue", "create_pr", "merge_pr", "comment", "close_issue"]);
const READ_GITHUB_ACTIONS = new Set(["list_pull_requests"]);

function needsConfirmation(task: WorkerTask): boolean {
  if (task.workerType === "conversational") return false;

  if (task.workerType === "gmail") {
    const action = ((task.parameters?.action as string) ?? "send_email").toLowerCase();
    return action !== "search"; // sending is always a write
  }

  if (task.workerType === "github") {
    const action = ((task.parameters?.action as string) ?? "").toLowerCase();
    return WRITE_GITHUB_ACTIONS.has(action); // anything not in this set (incl. "list_pull_requests") is a read
  }

  return false;
}

// ============================================================================
// User-preference extraction (same convention as the planner: bracketed
// metadata lines injected into conversationHistory upstream)
// ============================================================================

function extractUserPrefs(conversationHistory: string[]): string {
  for (const line of conversationHistory ?? []) {
    if (line?.trim().startsWith("[User preferences:")) return line.trim();
  }
  return "";
}

// ============================================================================
// Field drafting
// ============================================================================

const GmailDraftSchema = z.object({
  to: z.string().describe("Recipient email address"),
  subject: z.string(),
  body: z.string(),
});

const GithubDraftSchema = z.object({
  title: z.string().default(""),
  body: z.string().default(""),
});

async function draftGmailFields(
  task: WorkerTask,
  userQuery: string,
  context: string,
  userPrefs: string
): Promise<{ to: string; subject: string; body: string }> {
  const p = task.parameters ?? {};
  if (p.to && p.subject && p.body) {
    return { to: p.to as string, subject: p.subject as string, body: p.body as string };
  }

  try {
    const drafted = await draftModel
      .withStructuredOutput(GmailDraftSchema, { name: "email_draft" })
      .invoke([
        new SystemMessage(
          "Draft an email based on the admin's request, retrieved context, and known preferences."
        ),
        new HumanMessage(
          [
            userPrefs,
            `Admin request: ${userQuery}`,
            p ? `Known params: ${JSON.stringify(p)}` : "",
            context ? `Context:\n${context.slice(0, 2000)}` : "",
          ]
            .filter(Boolean)
            .join("\n\n")
        ),
      ]);
    return {
      to: (p.to as string) || drafted.to,
      subject: (p.subject as string) || drafted.subject,
      body: (p.body as string) || drafted.body,
    };
  } catch {
    return { to: (p.to as string) ?? "", subject: (p.subject as string) ?? "", body: (p.body as string) ?? "" };
  }
}

async function draftGithubFields(
  task: WorkerTask,
  userQuery: string,
  context: string,
  userPrefs: string
): Promise<{ title: string; body: string }> {
  const p = task.parameters ?? {};
  if (p.title && p.body) return { title: p.title as string, body: p.body as string };

  const action = (p.action as string) ?? "";
  if (action === "merge_pr" || action === "close_issue") {
    // Nothing to draft — these actions just need confirmation, not content.
    return { title: (p.title as string) ?? "", body: (p.body as string) ?? "" };
  }

  try {
    const drafted = await draftModel
      .withStructuredOutput(GithubDraftSchema, { name: "github_draft" })
      .invoke([
        new SystemMessage(`Draft the title/body for a GitHub "${action}" action based on the admin's request.`),
        new HumanMessage(
          [
            userPrefs,
            `Admin request: ${userQuery}`,
            p ? `Known params: ${JSON.stringify(p)}` : "",
            context ? `Context:\n${context.slice(0, 2000)}` : "",
          ]
            .filter(Boolean)
            .join("\n\n")
        ),
      ]);
    return {
      title: ((p.title as string) || drafted.title) ?? "",
      body: ((p.body as string) || drafted.body) ?? "",
    };
  } catch {
    return { title: (p.title as string) ?? "", body: (p.body as string) ?? "" };
  }
}

// ============================================================================
// Interrupt payload
// ============================================================================

interface InterruptPayload {
  type: "gmail" | "github";
  taskId: number;
  action: string;
  userQuery: string;
  [key: string]: unknown;
}

async function buildInterruptPayload(
  task: WorkerTask,
  userQuery: string,
  context: string,
  userPrefs: string
): Promise<InterruptPayload> {
  if (task.workerType === "gmail") {
    const fields = await draftGmailFields(task, userQuery, context, userPrefs);
    return { type: "gmail", taskId: task.id, action: task.description || "Send email", userQuery, ...fields };
  }
  // github
  const fields = await draftGithubFields(task, userQuery, context, userPrefs);
  return {
    type: "github",
    taskId: task.id,
    action: (task.parameters?.action as string) ?? task.description,
    repo: task.parameters?.repo as string,
    userQuery,
    ...fields,
  };
}

// ============================================================================
// Node
// ============================================================================

interface ConfirmationPayload {
  task: WorkerTask;
  context: string;
  userQuery: string;
  adminId: string;
  conversationHistory: string[];
}

function rejectResult(task: WorkerTask, output: string): TaskResult {
  return { taskId: task.id, workerType: task.workerType, success: false, output, usedContext: false, error: "user_rejected" };
}

// Must NOT be wrapped in try/catch around the interrupt() call itself —
// LangGraph needs that throw to propagate uncaught to suspend the graph.
export async function confirmationNode(
  payload: ConfirmationPayload
): Promise<{ hitlApprovedPayload?: PendingApproval[]; results?: TaskResult[] }> {
  const { task, context, userQuery, adminId, conversationHistory } = payload;
  const userPrefs = extractUserPrefs(conversationHistory);

  // Read-only: pass straight through, no interrupt.
  if (!needsConfirmation(task)) {
    return { hitlApprovedPayload: [{ task, context, userQuery, adminId, summary: "" }] };
  }

  const interruptData = await buildInterruptPayload(task, userQuery, context, userPrefs);

  const userResponse: string = interrupt(interruptData); // ← GRAPH FREEZES HERE

  const clean = (userResponse ?? "").trim();

  if (/^(reject|cancel|no|n)$/i.test(clean)) {
    return { results: [rejectResult(task, "Action cancelled by admin.")] };
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(clean);
  } catch {
    return { results: [rejectResult(task, "Action cancelled (invalid response).")] };
  }

  if (!data.approved) {
    return { results: [rejectResult(task, "Action cancelled by admin.")] };
  }

  const updatedParams: Record<string, unknown> = { ...task.parameters };
  let finalContext = context;

  if (task.workerType === "gmail") {
    updatedParams.to = data.to ?? interruptData.to ?? "";
    updatedParams.subject = data.subject ?? interruptData.subject ?? "";
    updatedParams.body = data.body ?? interruptData.body ?? "";
    updatedParams.action = "send_email";
    finalContext = `CONFIRMED EMAIL — To: ${updatedParams.to} | Subject: ${updatedParams.subject}`;
  } else if (task.workerType === "github") {
    if (data.title !== undefined) updatedParams.title = data.title;
    else if (interruptData.title !== undefined) updatedParams.title = interruptData.title;
    if (data.body !== undefined) updatedParams.body = data.body;
    else if (interruptData.body !== undefined) updatedParams.body = interruptData.body;
    finalContext = `CONFIRMED GITHUB ${updatedParams.action} on ${updatedParams.repo}`;
  }

  const updatedTask: WorkerTask = { ...task, parameters: updatedParams };

  return {
    hitlApprovedPayload: [{ task: updatedTask, context: finalContext, userQuery, adminId, summary: "" }],
  };
}