import { NextRequest } from "next/server";
import { adminAgent } from "@/lib/admin-agent/graph";
import { appendMessage, getThread, updateLastMessage } from "@/lib/admin-agent/thread-store";
// import { requireAdmin } from "@/lib/auth-guard";

export async function POST(req: NextRequest) {
  // const admin = await requireAdmin(req);
  // if (!admin) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { threadId: uiThreadId, decision, adminId } = body as {
    threadId: string; // the UI conversation thread id, as before
    decision: string | Record<string, unknown>;
    adminId: string;
  };

  if (!uiThreadId) return new Response(JSON.stringify({ error: "threadId is required" }), { status: 400 });
  if (decision === undefined)
    return new Response(JSON.stringify({ error: "decision is required" }), { status: 400 });

  const thread = await getThread(uiThreadId);
  const last = thread?.messages[thread.messages.length - 1];

  // execThreadId is the graph's per-turn checkpoint id that was stashed on
  // the pending message when it interrupted (see route.ts). Resuming MUST
  // target that exact id, not the UI conversation threadId — they are
  // different ids on purpose (see graph.ts's stream() doc comment).
  const execThreadId = last?.hitl?.execThreadId;
  if (!last?.hitl || last.hitl.status !== "pending" || !execThreadId) {
    return new Response(
      JSON.stringify({ error: "No pending confirmation found on this thread. It may have expired or already been resolved." }),
      { status: 409 }
    );
  }

  const decisionStr = typeof decision === "string" ? decision : JSON.stringify(decision);
  const isApproved = typeof decision === "object" && (decision as any)?.approved === true;

  // Flip the last (pending) message in place to approved/rejected.
  await updateLastMessage(uiThreadId, {
    ...last,
    hitl: {
      ...last.hitl,
      status: isApproved ? "approved" : "rejected",
      fields: typeof decision === "object" ? (decision as Record<string, unknown>) : last.hitl.fields,
    },
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      let assembled = "";

      try {
        for await (const evt of adminAgent.resumeStream(execThreadId, decisionStr)) {
          if (evt.type === "interrupt") {
            // A resumed run can itself pause again (e.g. multi-step task).
            // evt.threadId here is still the SAME execThreadId we resumed —
            // LangGraph doesn't mint a new one mid-run — so this remains
            // correct to store for a subsequent resume.
            await appendMessage(adminId ?? thread?.adminId ?? "admin", uiThreadId, {
              id: crypto.randomUUID(),
              role: "assistant",
              content: assembled || "I need your approval before continuing.",
              createdAt: new Date().toISOString(),
              hitl: {
                status: "pending",
                type: (evt.confirmationRequired as any)?.type,
                action: (evt.confirmationRequired as any)?.action,
                fields: evt.confirmationRequired as Record<string, unknown>,
                execThreadId: evt.threadId,
              },
            });
            send("interrupt", evt);
          } else if (evt.type === "token") {
            assembled += evt.text;
            send("token", evt);
          } else if (evt.type === "done") {
            await appendMessage(adminId ?? thread?.adminId ?? "admin", uiThreadId, {
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