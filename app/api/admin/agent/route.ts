import { NextRequest } from "next/server";
import { adminAgent } from "@/lib/admin-agent/graph";
import { appendMessage, createThread, getThread } from "@/lib/admin-agent/thread-store";
// import { requireAdmin } from "@/lib/auth-guard"; // wire up to your existing admin auth

export async function POST(req: NextRequest) {
  // const admin = await requireAdmin(req);
  // if (!admin) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { userQuery, conversationHistory, adminId, threadId: incomingThreadId } = body as {
    userQuery: string;
    conversationHistory?: string[];
    adminId: string;
    threadId?: string; // omit to start a new conversation
  };

  if (!userQuery?.trim()) return new Response(JSON.stringify({ error: "userQuery is required" }), { status: 400 });
  if (!adminId) return new Response(JSON.stringify({ error: "adminId is required" }), { status: 400 });

  // This is the UI-facing, persistent CONVERSATION thread id — lives in
  // thread-store.ts, shows up in the sidebar, spans every turn. It is
  // deliberately NOT the same id used for the LangGraph checkpointer inside
  // adminAgent.stream() (see graph.ts's doc comment there for why conflating
  // the two causes cross-turn state bleed). We mint/confirm it here, up
  // front, rather than letting the graph invent conversation identity —
  // that's not its job.
  let uiThreadId = incomingThreadId;
  if (uiThreadId) {
    const existing = await getThread(uiThreadId);
    if (!existing) await createThread(adminId, uiThreadId);
  } else {
    uiThreadId = `${adminId}_${crypto.randomUUID().slice(0, 8)}`;
    await createThread(adminId, uiThreadId);
  }

  // Persist the user's message immediately — we already have a confirmed
  // uiThreadId, no need to wait on anything from the graph for this.
  // titleHint (4th arg) sets the thread's sidebar title from the first
  // real user message instead of leaving it stuck on "New chat".
  await appendMessage(
    adminId,
    uiThreadId,
    {
      id: crypto.randomUUID(),
      role: "user",
      content: userQuery,
      createdAt: new Date().toISOString(),
    },
    userQuery
  );

  const encoder = new TextEncoder();
  const finalUiThreadId = uiThreadId;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Send this first — the client's existing
      // `if (event === "thread") setActiveThreadId(data.threadId)` logic
      // keeps working completely unchanged, it just gets the UI thread id
      // immediately instead of waiting on the graph.
      send("thread", { type: "thread", threadId: finalUiThreadId });

      let assembled = "";

      try {
        // stream() mints its own fresh per-turn execution id internally —
        // we don't pass one in. Multi-turn memory comes entirely from
        // conversationHistory, not from reusing a checkpoint thread_id.
        for await (const evt of adminAgent.stream({ adminId, userQuery, conversationHistory })) {
          if (evt.type === "thread") {
            // This is the graph's per-turn EXEC id, not the UI conversation
            // id — deliberately not forwarded to the client as "thread"
            // (already sent above). Only used below if this turn interrupts.
            continue;
          } else if (evt.type === "token") {
            assembled += evt.text;
            send("token", evt);
          } else if (evt.type === "interrupt") {
            await appendMessage(adminId, finalUiThreadId, {
              id: crypto.randomUUID(),
              role: "assistant",
              content: assembled || "I need your approval before continuing.",
              createdAt: new Date().toISOString(),
              hitl: {
                status: "pending",
                type: (evt.confirmationRequired as any)?.type,
                action: (evt.confirmationRequired as any)?.action,
                fields: evt.confirmationRequired as Record<string, unknown>,
                // The graph's per-turn exec thread id — required to resume
                // THIS specific paused turn later. Not shown to the client;
                // resume/route.ts reads it back out of thread-store.
                execThreadId: evt.threadId,
              },
            });
            send("interrupt", evt);
          } else if (evt.type === "done") {
            await appendMessage(adminId, finalUiThreadId, {
              id: crypto.randomUUID(),
              role: "assistant",
              content: evt.response,
              createdAt: new Date().toISOString(),
            });
            send("done", evt);
          } else if (evt.type === "error") {
            send("error", evt);
          }
        }
      } catch (err) {
        send("error", { message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}