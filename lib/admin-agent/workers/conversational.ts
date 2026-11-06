import { ChatGroq } from "@langchain/groq";
import { BaseMessage, SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import type { AdminAgentStateType, TaskResult, WorkerTask } from "../types";

const model = new ChatGroq({
  model: process.env.ADMIN_AGENT_WORKER_MODEL ?? "llama-3.1-8b-instant",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.3,
});

export async function conversationalWorkerNode(payload: {
  task: WorkerTask;
  userQuery: string;
  context: string;
  conversationHistory: string[];
}): Promise<{ results: TaskResult[] }> {
  const { task, userQuery, context, conversationHistory } = payload;

  const messages: BaseMessage[] = [
    new SystemMessage(
      "You are the robotics club's ADMIN assistant. You have access to the club's " +
        "internal data (teams, projects, events, competitions) and can take actions via " +
        "GitHub and Gmail through other workers. Answer precisely and cite specifics from " +
        "the provided context when given."
    ),
  ];

  for (const line of conversationHistory.filter(Boolean)) {
    if (line.startsWith("user:")) messages.push(new HumanMessage(line.slice(5).trim()));
    else if (line.startsWith("assistant:")) messages.push(new AIMessage(line.slice(10).trim()));
  }

  messages.push(
    new HumanMessage(
      `Query: ${userQuery}` +
        (context ? `\n\nContext:\n${context}` : "") +
        `\n\nTask: ${task.description || "Respond to the query"}`
    )
  );

  try {
    // NOT tagged "final_answer" — when multiple tasks run, this output is
    // only an intermediate input to resultsAggregatorNode below, not the
    // text the admin should see streamed. See the tag on finalAnswerModel.
    const res = await model.invoke(messages);
    return {
      results: [
        {
          taskId: task.id,
          workerType: "conversational",
          success: true,
          output: res.content.toString(),
          usedContext: Boolean(context),
        },
      ],
    };
  } catch (err) {
    return {
      results: [
        {
          taskId: task.id,
          workerType: "conversational",
          success: false,
          output: `Failed: ${(err as Error).message}`,
          usedContext: false,
          error: String(err),
        },
      ],
    };
  }
}

// Tagged so the orchestrator's streamEvents consumer can pick out exactly
// the tokens that make up the admin-facing final answer (see graph.ts —
// `event.tags?.includes("final_answer")`).
const finalAnswerModel = model.withConfig({ tags: ["final_answer"] });

export async function resultsAggregatorNode(
  state: AdminAgentStateType
): Promise<Partial<AdminAgentStateType>> {
  const results = state.results ?? [];

  if (results.length === 0) return { finalResponse: "No tasks executed." };

  if (results.length === 1) {
    // Routed through the tagged model (rather than returning
    // results[0].output directly) so single-task turns — the common case —
    // stream token-by-token too, instead of only multi-task ones. This costs
    // one extra cheap Groq call per turn; if you'd rather skip that, revert
    // to `return { finalResponse: results[0].output }` and accept that
    // single-task replies arrive as one lump `done` event instead of streamed.
    const res = await finalAnswerModel.invoke([
      new SystemMessage(
        "Return the following result to the admin. Lightly polish phrasing/formatting only — do not add, remove, or alter any facts."
      ),
      new HumanMessage(results[0].output),
    ]);
    return { finalResponse: res.content.toString() };
  }

  const resultsText = results.map((r) => `[${r.workerType.toUpperCase()}] ${r.output.slice(0, 500)}`).join("\n\n");

  const res = await finalAnswerModel.invoke([
    new SystemMessage("Integrate results from multiple sources into one coherent admin-facing reply."),
    new HumanMessage(`Query: ${state.userQuery}\n\nResults:\n${resultsText}\n\nFinal reply:`),
  ]);

  return { finalResponse: res.content.toString() };
}
