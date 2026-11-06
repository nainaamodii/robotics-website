import { StateGraph, START, END, Send, Command } from "@langchain/langgraph";
import { AdminAgentState, type AdminAgentStateType, type TaskResult } from "./types";
import { planningNode, routeAfterPlanning } from "./planning";
import { dbContextNode, webContextNode, mixedContextNode } from "./context";
import { confirmationNode } from "./hitl";
import { runGithubTask } from "./workers/github";
import { runGmailTask } from "./workers/gmail";
import { conversationalWorkerNode, resultsAggregatorNode } from "./workers/conversational";
import { getCheckpointer } from "./checkpointer";

// ── Fanout: route each planned task to the right node ──────────────────────
// conversational tasks run directly; gmail/github tasks ALWAYS go through
// confirmationNode, which decides internally (via needsConfirmation) whether
// to actually pause for approval or pass straight through for reads.
//
// If `tasks` is somehow empty (should be prevented upstream by planning.ts's
// fallback-task guard, but defense in depth matters here), LangGraph treats
// an empty Send[] as "no next node" and just stops — silently skipping
// aggregator entirely, which is how `finalResponse` was observed staying ""
// forever with no error surfaced anywhere. Route straight to aggregator
// instead so the graph always terminates through a node that sets a real
// response ("No tasks executed." at minimum).
function fanoutToWorkers(state: AdminAgentStateType): Send[] | "aggregator" {
  const context = state.combinedContext ?? "";
  const tasks = state.tasks ?? [];

  if (tasks.length === 0) {
    console.warn("fanoutToWorkers: no tasks to run — routing straight to aggregator.");
    return "aggregator";
  }

  const sends: Send[] = [];
  for (const task of tasks) {
    const basePayload = {
      task,
      userQuery: state.userQuery,
      adminId: state.adminId,
      conversationHistory: state.conversationHistory ?? [],
      context,
    };

    if (task.workerType === "conversational") {
      sends.push(new Send("conversationalWorker", basePayload));
    } else {
      sends.push(new Send("confirmationNode", basePayload));
    }
  }
  return sends;
}

// ── After confirmationNode: execute approved write actions ──────────────────
async function executeApprovedNode(state: AdminAgentStateType): Promise<Partial<AdminAgentStateType>> {
  const approved = state.hitlApprovedPayload ?? [];
  if (approved.length === 0) return { hitlApprovedPayload: [] };

  const results = await Promise.all(
    approved.map((a) => (a.task.workerType === "github" ? runGithubTask(a) : runGmailTask(a)))
  );
  return { results, hitlApprovedPayload: [] };
}

export function buildAdminAgentGraph(checkpointer: Awaited<ReturnType<typeof getCheckpointer>>) {
  const g = new StateGraph(AdminAgentState)
    .addNode("planning", planningNode)
    .addNode("dbContext", dbContextNode)
    .addNode("webContext", webContextNode)
    .addNode("mixedContext", mixedContextNode)
    .addNode("executeTasks", (s: AdminAgentStateType) => s)
    .addNode("conversationalWorker", conversationalWorkerNode)
    .addNode("confirmationNode", confirmationNode)
    .addNode("executeApproved", executeApprovedNode)
    .addNode("aggregator", resultsAggregatorNode)

    .addEdge(START, "planning")
    .addConditionalEdges("planning", routeAfterPlanning, {
      dbContext: "dbContext",
      webContext: "webContext",
      mixedContext: "mixedContext",
      executeTasks: "executeTasks",
    })
    .addEdge("dbContext", "executeTasks")
    .addEdge("webContext", "executeTasks")
    .addEdge("mixedContext", "executeTasks")
    .addConditionalEdges("executeTasks", fanoutToWorkers, ["conversationalWorker", "confirmationNode", "aggregator"])
    .addEdge("conversationalWorker", "aggregator")
    .addEdge("confirmationNode", "executeApproved")
    .addEdge("executeApproved", "aggregator")
    .addEdge("aggregator", END);

  return g.compile({ checkpointer });
}

// ============================================================================
// Streaming event shapes yielded by stream()/resumeStream() — the API routes
// translate these 1:1 into SSE `event:`/`data:` frames.
//
// `threadId` in these events is a per-TURN LangGraph checkpoint id, NOT the
// UI's persistent conversation id. See stream()'s doc comment below for why
// that distinction matters — conflating the two causes cross-turn state
// bleed (see the accumulating `results`/`hitlApprovedPayload` reducers in
// types.ts, which can only grow within a single checkpoint thread).
// ============================================================================

export type AgentStreamEvent =
  | { type: "thread"; threadId: string }
  | { type: "token"; text: string }
  | { type: "interrupt"; threadId: string; confirmationRequired: unknown }
  | {
      type: "done";
      threadId: string;
      response: string;
      metadata: { totalTasks: number; successfulTasks: number; workersUsed: string[] };
    }
  | { type: "error"; message: string };

// ============================================================================
// ORCHESTRATOR — thin wrapper exposing process()/resume() (non-streaming,
// kept for scripts/tests) and stream()/resumeStream() (used by the UI).
// ============================================================================

export class AdminAgentOrchestrator {
  private graphPromise = getCheckpointer().then(buildAdminAgentGraph);

  // ---- non-streaming (unchanged behavior) ----

  async process(params: { adminId: string; userQuery: string; conversationHistory?: string[] }) {
    const graph = await this.graphPromise;
    const threadId = `${params.adminId}_${crypto.randomUUID().slice(0, 8)}`;
    const config = { configurable: { thread_id: threadId } };

    const initialState: Partial<AdminAgentStateType> = {
      adminId: params.adminId,
      userQuery: params.userQuery.trim(),
      conversationHistory: params.conversationHistory ?? [],
    };

    const result = await graph.invoke(initialState, config);
    return this.formatResult(result, threadId);
  }

  async resume(threadId: string, decision: string) {
    const graph = await this.graphPromise;
    const config = { configurable: { thread_id: threadId } };
    const result = await graph.invoke(new Command({ resume: decision }), config);
    return this.formatResult(result, threadId);
  }

  // ---- streaming (used by the chat UI) ----

  // IMPORTANT: the `execThreadId` minted here is intentionally NOT the UI's
  // persistent conversation threadId. It's fresh per turn. The LangGraph
  // checkpointer's thread_id exists to let ONE turn pause (HITL) and resume
  // — it's not a place to accumulate whole-conversation state, because
  // several state channels (results, hitlApprovedPayload — see types.ts) use
  // concatenating reducers that can only grow, never reset. Reusing the same
  // thread_id across multiple turns of one conversation causes every prior
  // turn's results to silently accumulate and get re-synthesized into later
  // answers (symptom: metadata.totalTasks growing unboundedly, and later
  // responses echoing earlier ones). Multi-turn memory is handled entirely
  // via `conversationHistory` (passed in explicitly, built by the caller
  // from thread-store.ts), never via the checkpointer.
  //
  // The caller (route.ts) must persist the `execThreadId` from the
  // `interrupt` event (e.g. inside the HITL snapshot on the paused message)
  // so a later resumeStream() call can target the exact turn that got
  // interrupted — NOT the UI conversation's threadId.
  async *stream(params: {
    adminId: string;
    userQuery: string;
    conversationHistory?: string[];
  }): AsyncGenerator<AgentStreamEvent> {
    const graph = await this.graphPromise;
    const execThreadId = `${params.adminId}_${crypto.randomUUID().slice(0, 8)}`;
    const config = { configurable: { thread_id: execThreadId }, version: "v2" as const };

    const initialState: Partial<AdminAgentStateType> = {
      adminId: params.adminId,
      userQuery: params.userQuery.trim(),
      conversationHistory: params.conversationHistory ?? [],
    };

    yield { type: "thread", threadId: execThreadId };

    try {
      yield* this.consumeEvents(graph.streamEvents(initialState, config), execThreadId, graph, config);
    } catch (err) {
      yield { type: "error", message: String(err) };
    }
  }

  // `execThreadId` must be the exact id that was yielded in the `interrupt`
  // event for the turn being resumed — NOT the UI conversation threadId.
  async *resumeStream(execThreadId: string, decision: string): AsyncGenerator<AgentStreamEvent> {
    const graph = await this.graphPromise;
    const config = { configurable: { thread_id: execThreadId }, version: "v2" as const };

    try {
      yield* this.consumeEvents(
        graph.streamEvents(new Command({ resume: decision }), config),
        execThreadId,
        graph,
        config
      );
    } catch (err) {
      yield { type: "error", message: String(err) };
    }
  }

  private async *consumeEvents(
    events: AsyncIterable<any>,
    threadId: string,
    graph: Awaited<ReturnType<typeof buildAdminAgentGraph>>,
    config: { configurable: { thread_id: string } }
  ): AsyncGenerator<AgentStreamEvent> {
    for await (const event of events) {
      if (event.event === "on_chat_model_stream" && event.tags?.includes("final_answer")) {
        const text = event.data?.chunk?.content;
        if (typeof text === "string" && text.length > 0) {
          yield { type: "token", text };
        }
      }
      // Deliberately NOT trying to detect interrupts from on_chain_end
      // events here anymore — confirmed unreliable: streamEvents() just
      // stops producing events once a thread pauses on interrupt(), with
      // no distinct "paused" event, so a mid-stream check either never
      // fires or fires inconsistently. graph.getState() below is the
      // documented, reliable source of truth for "is this thread paused."
    }

    // The event stream ends identically whether the run finished OR paused
    // on an interrupt — there's no separate signal for "paused" from
    // streamEvents() itself. Check the checkpointed state directly: if any
    // task in the snapshot has pending `interrupts`, the graph is paused
    // there, not finished, and finalResponse/results will still be blank
    // (the aggregator hasn't run yet) — that's the bug this replaces: we
    // were previously yielding a "done" event with that blank state instead
    // of correctly reporting "interrupt".
    const state = await graph.getState(config);
    const pendingInterrupt = (state.tasks ?? []).flatMap((t: any) => t.interrupts ?? [])[0];

    if (pendingInterrupt) {
      yield { type: "interrupt", threadId, confirmationRequired: pendingInterrupt.value };
      return;
    }

    const values = (state.values ?? {}) as AdminAgentStateType;
    const results = values.results ?? [];

    yield {
      type: "done",
      threadId,
      response: values.finalResponse ?? "",
      metadata: {
        totalTasks: results.length,
        successfulTasks: results.filter((r: TaskResult) => r.success).length,
        workersUsed: [...new Set(results.map((r: TaskResult) => r.workerType))],
      },
    };
  }

  private formatResult(result: any, threadId: string) {
    if (result.__interrupt__ && result.__interrupt__.length > 0) {
      const first = result.__interrupt__[0];
      return {
        success: true,
        interrupted: true,
        threadId,
        confirmationRequired: first.value,
      };
    }
    return {
      success: true,
      interrupted: false,
      threadId,
      response: result.finalResponse ?? "",
      metadata: {
        totalTasks: (result.results ?? []).length,
        successfulTasks: (result.results ?? []).filter((r: TaskResult) => r.success).length,
        workersUsed: [...new Set((result.results ?? []).map((r: TaskResult) => r.workerType))],
      },
    };
  }
}

export const adminAgent = new AdminAgentOrchestrator();