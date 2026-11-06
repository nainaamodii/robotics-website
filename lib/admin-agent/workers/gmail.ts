import { google } from "googleapis";
import type { PendingApproval, TaskResult } from "../types";

// Assumes the club's admin Gmail account was connected once via Google OAuth
// (scopes: gmail.send + gmail.readonly) and the refresh token is stored
// server-side — e.g. in a small "google_tokens" collection keyed by adminId,
// NOT on the public `users` collection. Wire getRefreshToken() to wherever
// you persist it (env var for a single shared admin inbox is the simplest
// start; a per-admin DB-backed token is the real version).
async function getRefreshToken(adminId: string): Promise<string> {
  const token = process.env.ADMIN_GMAIL_REFRESH_TOKEN;
  if (!token) {
    throw new Error(
      `No Gmail refresh token configured for admin ${adminId}. Set ADMIN_GMAIL_REFRESH_TOKEN or wire up per-admin token storage.`
    );
  }
  return token;
}

async function getGmailClient(adminId: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  const refreshToken = await getRefreshToken(adminId);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

function buildRawMessage(to: string, subject: string, body: string): string {
  const message = [`To: ${to}`, "Content-Type: text/plain; charset=utf-8", `Subject: ${subject}`, "", body].join(
    "\n"
  );
  return Buffer.from(message).toString("base64url");
}

export async function runGmailTask(approved: PendingApproval): Promise<TaskResult> {
  const { task, adminId } = approved;
  const params = task.parameters ?? {};

  try {
    const gmail = await getGmailClient(adminId);
    const action = (params.action as string) ?? "send_email";

    switch (action) {
      case "send_email": {
        const to = params.to as string;
        const subject = (params.subject as string) ?? "(no subject)";
        const body = (params.body as string) ?? "";
        if (!to) return fail(task.id, "Missing recipient (parameters.to)");

        const raw = buildRawMessage(to, subject, body);
        const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
        return ok(task.id, `Email sent to ${to} (id: ${res.data.id})`);
      }
      case "search": {
        const q = (params.query as string) ?? "";
        const res = await gmail.users.messages.list({ userId: "me", q, maxResults: 10 });
        const ids = (res.data.messages ?? []).map((m) => m.id).filter(Boolean) as string[];
        return ok(task.id, `Found ${ids.length} messages matching "${q}"`, false);
      }
      default:
        return fail(task.id, `Unknown Gmail action "${action}"`);
    }
  } catch (err) {
    return fail(task.id, `Gmail task failed: ${(err as Error).message}`, String(err));
  }
}

function ok(taskId: number, output: string, usedContext = true): TaskResult {
  return { taskId, workerType: "gmail", success: true, output, usedContext };
}
function fail(taskId: number, output: string, error?: string): TaskResult {
  return { taskId, workerType: "gmail", success: false, output, usedContext: false, error };
}