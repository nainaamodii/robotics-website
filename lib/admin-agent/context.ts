import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { adminDbTools } from "./tools";
import type { AdminAgentStateType, ContextItem } from "./types";

const retrievalModel = new ChatGoogleGenerativeAI({
  model: process.env.ADMIN_AGENT_RETRIEVAL_MODEL ?? "gemini-3.6-flash",
  apiKey: process.env.GEMINI_API_KEY, // @langchain/google-genai defaults to GOOGLE_API_KEY otherwise
  temperature: 0,
});

const dbRetrievalAgent = createReactAgent({
  llm: retrievalModel,
  tools: adminDbTools,
});

const RETRIEVAL_SYSTEM = `You are a data-retrieval agent for the robotics club admin assistant.
Use the available tools to gather exactly the data needed to answer the query below.

BE FRUGAL — every tool call and its full result gets re-sent to you again on your next turn, so
unnecessary or repeated calls compound quickly:
  - Prefer countOnly:true over fetching documents whenever the question is "how many".
  - Prefer the "*ByIdAdmin" detail tools over chaining multiple list/lookup calls — several of
    them already resolve relations for you (getTeamByIdAdmin includes leader+members with real
    names/emails already; getEventByIdAdmin includes its competitions; getCompetitionByIdAdmin
    includes its teams). Read each tool's description before calling it — if it says a relation
    is "already resolved", do not make a separate call to resolve that same relation yourself.
  - Don't re-list a collection you already have results from just to double-check.
  - Stop as soon as you have enough to answer — do not keep exploring "just in case."
  - If a list result was truncated, narrow with more filters or a smaller limit rather than
    trying to page through it with repeated calls.

Call as many tools as genuinely needed (e.g. look up a team by id when you need its resolved
leader/members) but no more than that.

When done, respond with a concise plain-text summary of what you found — specific names,
statuses, ids, emails, counts — not a restatement of the tools you called. This summary will
be used directly as grounding context for another agent, so include concrete facts, not vague
paraphrasing.`;

export async function dbContextNode(
  state: AdminAgentStateType
): Promise<Partial<AdminAgentStateType>> {
  const plan = state.plan;
  if (!plan) return { combinedContext: "" };

  const result = await dbRetrievalAgent.invoke(
    {
      messages: [
        new SystemMessage(RETRIEVAL_SYSTEM),
        new HumanMessage(`Query: ${state.userQuery}\n\nPlanner's reasoning: ${plan.reasoning}`),
      ],
    },
    // Hard cap on ReAct steps — without this, an unproductive loop (model
    // re-exploring instead of converging) has no ceiling on token spend.
    // 8 steps comfortably covers even a 2-3 hop lookup (e.g. team -> its
    // competition -> that competition's other teams) with room to spare.
    { recursionLimit: 8 }
  );

  const messages = result.messages ?? [];
  const summary =
    [...messages].reverse().find((m: any) => typeof m.content === "string" && m.content.trim())?.content ?? "";

  const item: ContextItem = {
    source: "db",
    content: String(summary).slice(0, 4000),
    relevanceScore: 0.9,
    metadata: { toolCalls: messages.filter((m: any) => m._getType?.() === "tool").length },
  };

  return { contextItems: [item], combinedContext: `[DB]\n${item.content}` };
}

export async function webContextNode(
  state: AdminAgentStateType
): Promise<Partial<AdminAgentStateType>> {
  // Plug in whatever web-search provider you already use elsewhere in the app.
  const queries = state.plan?.searchQueries ?? [];
  const items: ContextItem[] = queries.map((q) => ({
    source: "web",
    content: `TODO: wire up web search for "${q}"`,
    relevanceScore: 0.5,
    metadata: { query: q },
  }));
  const combined = items.map((i) => `[Web: ${i.metadata.query}]\n${i.content}`).join("\n\n");
  return { contextItems: items, combinedContext: combined };
}

export async function mixedContextNode(
  state: AdminAgentStateType
): Promise<Partial<AdminAgentStateType>> {
  const [dbRes, webRes] = await Promise.all([dbContextNode(state), webContextNode(state)]);
  const items = [...(dbRes.contextItems ?? []), ...(webRes.contextItems ?? [])];
  const combined = [dbRes.combinedContext, webRes.combinedContext].filter(Boolean).join("\n\n");
  return { contextItems: items, combinedContext: combined.slice(0, 6000) };
}