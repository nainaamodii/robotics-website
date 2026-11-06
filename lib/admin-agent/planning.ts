import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { ExecutionPlanSchema, type AdminAgentStateType, type ExecutionPlan } from "./types";

const planningModel = new ChatGroq({
  model: process.env.ADMIN_AGENT_PLANNING_MODEL ?? "llama-3.3-70b-versatile",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0,
}).withStructuredOutput(ExecutionPlanSchema, { name: "execution_plan" });

const PLANNING_SYSTEM = `You are the planning agent for the robotics-club ADMIN assistant.
You MUST return a valid structured plan for the CURRENT query only.

The conversation contains two sections:
  <conversation_history> — prior turns, for REFERENCE ONLY (resolving pronouns like "it"/"that team").
  <current_query> — the ONLY thing you plan for.

WORKERS AVAILABLE:
  "conversational" — answer from context, summarize, analyze, draft text (no side effects)
  "github"         — repo/PR/issue operations on the club's GitHub org
  "gmail"          — read/search/send email from the club's admin inbox

CONTEXT:
  needsContext=true + contextType="db" when the query needs data from our own
    MongoDB (members, teams, projects, events, competitions, invitations,
    join requests, media, site content). You do NOT need to name specific
    collections — a separate retrieval agent will look up whatever's needed.
  needsContext=true + contextType="web" for general knowledge not in our DB.
  needsContext=true + contextType="mixed" for both.
  needsContext=false + contextType=null for direct actions/greetings that need no lookup
    (e.g. "send an email to X saying Y" — everything needed is already in the query).

TASK SPLITTING:
  If the user wants to look something up AND THEN act (email or GitHub write) on it,
  create two tasks: task 1 worker="conversational" (produce the info/draft),
  task 2 worker="github" or "gmail" (the actual write action), each with a unique
  integer id starting at 1.

  For gmail tasks, always try to populate parameters.to / parameters.subject / parameters.body
  as best you can infer them (leave blank string if genuinely unknown — the worker will ask).
  For github tasks, populate parameters.repo and parameters.action, using EXACTLY one of these
  action values — no others exist:
    "create_issue", "comment", "create_pr", "merge_pr", "close_issue", "list_pull_requests"
  Repository creation, deleting repos/issues/PRs, managing collaborators, and any other GitHub
  action NOT in that list are not supported. If asked for one of these, do NOT create a github
  task — instead create a single conversational task whose job is to tell the admin plainly that
  this isn't currently supported, rather than guessing at an action name.

EXAMPLES:
  "Which teams haven't submitted for Robotics Sprint 2026?"
    -> reasoning: DB lookup on teams/competitions, no action needed.
       needsContext=true, contextType="db"
       tasks=[{id:1, workerType:"conversational", description:"list unsubmitted teams"}]

  "Email all leaders of unsubmitted teams reminding them of the deadline"
    -> reasoning: need DB lookup for teams/leaders first, then send email(s).
       needsContext=true, contextType="db"
       tasks=[
         {id:1, workerType:"conversational", description:"gather leader emails + team names"},
         {id:2, workerType:"gmail", description:"send reminder email", parameters:{subject:"Submission deadline reminder"}}
       ]

  "Open a GitHub issue on club/website about the broken projects page"
    -> reasoning: direct GitHub write, no context needed.
       needsContext=false, contextType=null
       tasks=[{id:1, workerType:"github", description:"create issue", parameters:{repo:"club/website", action:"create_issue", title:"Broken projects page"}}]

  "What's the capital of France?"
    -> reasoning: general knowledge, not admin data.
       needsContext=true, contextType="web", searchQueries=["capital of France"]
       tasks=[{id:1, workerType:"conversational", description:"answer"}]
`;

// Kept in sync with workers/github.ts and workers/gmail.ts's implemented
// actions. Post-hoc validation instead of a schema-level enum — see the
// comment on `action` in types.ts for why a hard enum there caused the
// whole planning call to fail for unrelated conversational queries. Clears
// (rather than rejects) any value that doesn't belong: a conversational
// task's stray action gets dropped entirely (ignored downstream anyway);
// an unrecognized github/gmail action gets cleared so the worker's own
// "unknown action" fallback handles it gracefully instead of executing
// garbage.
const VALID_GITHUB_ACTIONS = new Set([
  "create_issue",
  "comment",
  "create_pr",
  "merge_pr",
  "close_issue",
  "list_pull_requests",
]);
const VALID_GMAIL_ACTIONS = new Set(["send_email", "search"]);

function normalizeTaskActions(tasks: ExecutionPlan["tasks"]): ExecutionPlan["tasks"] {
  return tasks.map((t) => {
    const action = t.parameters?.action;
    if (!action) return t;

    if (t.workerType === "conversational") {
      console.warn(`planningNode: dropping stray action "${action}" from a conversational task.`);
      const { action: _drop, ...rest } = t.parameters;
      return { ...t, parameters: rest };
    }
    if (t.workerType === "github" && !VALID_GITHUB_ACTIONS.has(action)) {
      console.warn(`planningNode: unrecognized github action "${action}" — clearing it.`);
      return { ...t, parameters: { ...t.parameters, action: undefined } };
    }
    if (t.workerType === "gmail" && !VALID_GMAIL_ACTIONS.has(action)) {
      console.warn(`planningNode: unrecognized gmail action "${action}" — clearing it.`);
      return { ...t, parameters: { ...t.parameters, action: undefined } };
    }
    return t;
  });
}

export async function planningNode(
  state: AdminAgentStateType
): Promise<Partial<AdminAgentStateType>> {
  const messages: BaseMessage[] = [new SystemMessage(PLANNING_SYSTEM)];

  const history = (state.conversationHistory ?? []).filter((l) => l && !l.startsWith("["));
  if (history.length > 0) {
    const historyText = history.slice(-6).join("\n");
    messages.push(
      new HumanMessage(
        `<conversation_history>\n${historyText}\n</conversation_history>\n\nReference only — do not plan for it.`
      )
    );
    messages.push(
      new AIMessage("Understood — I will plan exclusively for the current query.")
    );
  }
  messages.push(new HumanMessage(`<current_query>${state.userQuery.slice(0, 800)}</current_query>`));

  let plan: ExecutionPlan | null = null;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // withStructuredOutput's inferred return type reflects zod's *input*
      // type (fields with .default() read as optional) rather than the
      // *output* type after defaults are applied. Defaults are applied at
      // runtime regardless, so this cast just aligns the compile-time type
      // with what's actually guaranteed to be present.
      plan = (await planningModel.invoke(messages)) as ExecutionPlan;
      break;
    } catch (err) {
      lastErr = err;
    }
  }
  if (!plan) throw lastErr;

  // Guard: unique non-zero task ids
  const seen = new Set<number>();
  let maxId = 0;
  const tasks = plan.tasks.map((t) => {
    maxId = Math.max(maxId, t.id);
    return t;
  });
  const fixedTasks = tasks.map((t) => {
    if (t.id === 0 || seen.has(t.id)) {
      maxId += 1;
      seen.add(maxId);
      return { ...t, id: maxId };
    }
    seen.add(t.id);
    return t;
  });

  const finalPlan: ExecutionPlan = { ...plan, tasks: fixedTasks };

  // Guard against the model legitimately returning an empty plan (valid per
  // schema — `tasks` defaults to []  — but never actually correct; even a
  // greeting needs one conversational task). Groq/Llama structured output
  // occasionally under-generates like this. Rather than silently producing
  // a blank response (see graph.ts's fanoutToWorkers — an empty Send[]
  // array causes LangGraph to stop before ever reaching the aggregator),
  // inject a single fallback conversational task so the query always gets
  // *some* answer, even if just "I couldn't figure out what to do with
  // that — can you rephrase?" from the conversational worker.
  if (finalPlan.tasks.length === 0) {
    console.warn(
      `planningNode: model returned zero tasks for query "${state.userQuery.slice(0, 100)}" — injecting fallback conversational task.`
    );
    finalPlan.tasks = [
      {
        id: 1,
        title: "",
        workerType: "conversational",
        description:
          "The planner didn't produce a task for this query. Answer it directly if possible, or ask the admin to rephrase.",
        parameters: {},
      },
    ];
  }

  finalPlan.tasks = normalizeTaskActions(finalPlan.tasks);

  return { plan: finalPlan, tasks: finalPlan.tasks };
}

export function routeAfterPlanning(state: AdminAgentStateType): string {
  const plan = state.plan;
  if (!plan || !plan.needsContext || !plan.contextType) return "executeTasks";
  return { db: "dbContext", web: "webContext", mixed: "mixedContext" }[plan.contextType]!;
}