import { Annotation } from "@langchain/langgraph";
import { z } from "zod";

// ============================================================================
// TASK / PLAN SCHEMAS
// ============================================================================

export const WorkerTypeSchema = z.enum(["github", "gmail", "conversational"]);
export type WorkerType = z.infer<typeof WorkerTypeSchema>;

export const WorkerTaskSchema = z.object({
  id: z.number().int().min(1),
  title: z.string().default(""),
  workerType: WorkerTypeSchema,
  description: z.string().default(""),
  // Bounded, explicit fields — NOT z.record(z.any()). An open-ended
  // key-value bag JSON-schemas as {"type":"object"} with no defined
  // properties, which Groq/Llama function-calling handles noticeably worse
  // than Claude/GPT: it tends to produce malformed or empty arguments for
  // truly free-form objects ("Failed to call a function" / failed_generation
  // errors). Every field the planner might legitimately need to fill in
  // for a gmail or github task gets an explicit, optional slot instead.
  parameters: z
    .object({
      // gmail
      to: z.string().optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
      // github — deliberately a plain string, NOT an enum. This field is
      // shared across every workerType (including "conversational", where
      // it should just be absent), and valid values differ by workerType
      // besides. A hard enum here means: if the model puts ANY value in
      // `action` that isn't in the enum — including on a conversational
      // task where it should've left this field unset entirely — Groq
      // rejects the WHOLE tool call as invalid, not just that field,
      // crashing planning for completely unrelated queries. Validating
      // after the fact (see normalizeTaskActions in planning.ts) lets an
      // invalid/unexpected value get cleared gracefully instead.
      action: z.string().optional(),
      repo: z.string().optional(),
      title: z.string().optional(),
      issueNumber: z.number().optional(),
      prNumber: z.number().optional(),
      head: z.string().optional(),
      base: z.string().optional(),
    })
    .default({}),
});
export type WorkerTask = z.infer<typeof WorkerTaskSchema>;

export const ContextTypeSchema = z
  .enum(["db", "web", "mixed"])
  .nullable()
  .describe("db = internal MongoDB collections, web = general web search, mixed = both");

export const ExecutionPlanSchema = z.object({
  reasoning: z.string().min(1),
  needsContext: z.boolean().default(false),
  contextType: ContextTypeSchema.default(null),
  searchQueries: z.array(z.string()).default([]),
  tasks: z.array(WorkerTaskSchema).default([]),
});
export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;

// ============================================================================
// CONTEXT / RESULT SCHEMAS
// ============================================================================

export interface ContextItem {
  source: "db" | "web";
  content: string;
  relevanceScore: number;
  metadata: Record<string, unknown>;
}

export interface TaskResult {
  taskId: number;
  workerType: WorkerType;
  success: boolean;
  output: string;
  usedContext: boolean;
  error?: string;
}

// A task frozen for human approval before a write action runs.
export interface PendingApproval {
  task: WorkerTask;
  context: string;
  userQuery: string;
  adminId: string;
  // Human-readable summary shown to the admin for approval, e.g.
  // "Send email to alice@x.com: subject 'Re: sponsorship'..."
  summary: string;
}

// ============================================================================
// GRAPH STATE
// ============================================================================

function mergeResults(left: TaskResult[], right: TaskResult[]): TaskResult[] {
  return [...(left ?? []), ...(right ?? [])];
}

// Dedup by task id — mirrors the Python reference's `_merge_hitl_payloads`.
// Needed because multiple parallel confirmationNode branches (one per
// write-task) each write into this same key.
function mergeApprovedPayloads(left: PendingApproval[], right: PendingApproval[]): PendingApproval[] {
  const combined = [...(left ?? []), ...(right ?? [])];
  const seen = new Set<number>();
  const out: PendingApproval[] = [];
  for (const p of combined) {
    if (!p || seen.has(p.task.id)) continue;
    seen.add(p.task.id);
    out.push(p);
  }
  return out;
}

export const AdminAgentState = Annotation.Root({
  adminId: Annotation<string>(),
  userQuery: Annotation<string>(),
  conversationHistory: Annotation<string[]>({
    reducer: (_l, r) => r,
    default: () => [],
  }),
  plan: Annotation<ExecutionPlan | null>({
    reducer: (_l, r) => r,
    default: () => null,
  }),
  contextItems: Annotation<ContextItem[]>({
    reducer: (_l, r) => r,
    default: () => [],
  }),
  combinedContext: Annotation<string>({
    reducer: (_l, r) => r,
    default: () => "",
  }),
  tasks: Annotation<WorkerTask[]>({
    reducer: (_l, r) => r,
    default: () => [],
  }),
  results: Annotation<TaskResult[]>({
    reducer: mergeResults,
    default: () => [],
  }),
  finalResponse: Annotation<string>({
    reducer: (_l, r) => r,
    default: () => "",
  }),
  hitlApprovedPayload: Annotation<PendingApproval[]>({
    reducer: mergeApprovedPayloads,
    default: () => [],
  }),
});

export type AdminAgentStateType = typeof AdminAgentState.State;