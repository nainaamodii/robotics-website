import { Octokit } from "@octokit/rest";
import type { PendingApproval, TaskResult } from "../types";

function getOctokit(): Octokit {
  const token = process.env.GITHUB_PAT;
  if (!token) throw new Error("GITHUB_PAT not set");
  return new Octokit({ auth: token });
}

// repo param expected as "owner/name"
function splitRepo(repo: string): { owner: string; repoName: string } {
  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) throw new Error(`Invalid repo "${repo}", expected "owner/name"`);
  return { owner, repoName };
}

export async function runGithubTask(approved: PendingApproval): Promise<TaskResult> {
  const { task } = approved;
  const octokit = getOctokit();
  const params = task.parameters ?? {};
  const action = (params.action as string) ?? "";

  try {
    const { owner, repoName } = splitRepo(params.repo as string);

    switch (action) {
      case "create_issue": {
        const res = await octokit.issues.create({
          owner,
          repo: repoName,
          title: params.title ?? task.description,
          body: params.body ?? "",
        });
        return ok(task.id, `Created issue #${res.data.number}: ${res.data.html_url}`);
      }
      case "comment": {
        const res = await octokit.issues.createComment({
          owner,
          repo: repoName,
          issue_number: Number(params.issueNumber),
          body: params.body ?? "",
        });
        return ok(task.id, `Commented: ${res.data.html_url}`);
      }
      case "create_pr": {
        const res = await octokit.pulls.create({
          owner,
          repo: repoName,
          title: params.title ?? task.description,
          head: params.head,
          base: params.base ?? "main",
          body: params.body ?? "",
        });
        return ok(task.id, `Created PR #${res.data.number}: ${res.data.html_url}`);
      }
      case "merge_pr": {
        const res = await octokit.pulls.merge({
          owner,
          repo: repoName,
          pull_number: Number(params.prNumber),
        });
        return ok(task.id, `Merged: ${res.data.merged}`);
      }
      case "close_issue": {
        await octokit.issues.update({
          owner,
          repo: repoName,
          issue_number: Number(params.issueNumber),
          state: "closed",
        });
        return ok(task.id, `Closed issue #${params.issueNumber}`);
      }
      case "list_pull_requests": {
        const res = await octokit.pulls.list({ owner, repo: repoName, state: "open" });
        return ok(
          task.id,
          res.data.map((pr) => `#${pr.number} ${pr.title} (${pr.html_url})`).join("\n"),
          false
        );
      }
      default:
        return fail(task.id, `Unknown GitHub action "${action}"`);
    }
  } catch (err) {
    return fail(task.id, `GitHub task failed: ${(err as Error).message}`, String(err));
  }
}

function ok(taskId: number, output: string, usedContext = true): TaskResult {
  return { taskId, workerType: "github", success: true, output, usedContext };
}
function fail(taskId: number, output: string, error?: string): TaskResult {
  return { taskId, workerType: "github", success: false, output, usedContext: false, error };
}