import { z } from "zod";

// ============================================================================
// LIST tools — SLIM output, small id/name/status fields only. Most queries
// ("which teams are still draft", "how many projects are published") only
// need this. This is the main token-usage fix: the old design returned full
// verbose docs (contributors, links, achievements, ...) from list calls even
// when the query never needed them, and every one of those bytes gets
// re-sent to the model on every subsequent step of the ReAct loop.
// ============================================================================

const countOnlyField = z
  .boolean()
  .optional()
  .describe("If true, return only {count} instead of documents — use this for 'how many...' questions, it's far cheaper than fetching full docs.");

export const getUsersAdminSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  department: z.string().optional(),
  search: z.string().optional().describe("Matches against name, email, or codename"),
  limit: z.number().int().min(1).max(25).default(10),
  countOnly: countOnlyField,
});

export const getTeamsAdminSchema = z.object({
  competitionId: z.string().optional(),
  approvalStatus: z.enum(["draft", "submitted", "approved", "rejected"]).optional(),
  limit: z.number().int().min(1).max(25).default(10),
  countOnly: countOnlyField,
});

export const getProjectsAdminSchema = z.object({
  published: z.boolean().optional(),
  category: z.string().optional(),
  limit: z.number().int().min(1).max(25).default(10),
  countOnly: countOnlyField,
});

export const getEventsAdminSchema = z.object({
  year: z.number().int().optional(),
  activeOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(25).default(10),
  countOnly: countOnlyField,
});

export const getCompetitionsAdminSchema = z.object({
  eventId: z.string().optional(),
  registrationOpen: z.boolean().optional(),
  limit: z.number().int().min(1).max(25).default(10),
  countOnly: countOnlyField,
});

export const getInvitationsAdminSchema = z.object({
  teamId: z.string().optional(),
  status: z.enum(["pending", "accepted", "rejected"]).optional(),
  limit: z.number().int().min(1).max(25).default(10),
  countOnly: countOnlyField,
});

export const getJoinRequestsAdminSchema = z.object({
  teamId: z.string().optional(),
  status: z.enum(["pending", "accepted", "rejected"]).optional(),
  limit: z.number().int().min(1).max(25).default(10),
  countOnly: countOnlyField,
});

export const getMediaAdminSchema = z.object({
  limit: z.number().int().min(1).max(25).default(10),
  countOnly: countOnlyField,
});

// ============================================================================
// DETAIL tools — one record, full fields, WITH relations resolved where it's
// cheap to do so (one extra indexed query, not N+1). This is where
// "getTeamByIdAdmin" now also returns real leader/member names+emails
// instead of raw ObjectId strings the model would otherwise need a second
// (or Nth) tool call to resolve.
// ============================================================================

export const getUserByIdAdminSchema = z.object({ id: z.string() });
export const getTeamByIdAdminSchema = z.object({ id: z.string() });
export const getProjectByIdAdminSchema = z.object({ id: z.string() });
export const getEventByIdAdminSchema = z.object({ id: z.string() });
export const getCompetitionByIdAdminSchema = z.object({ id: z.string() });
export const getSiteContentAdminSchema = z.object({ sectionId: z.string() });