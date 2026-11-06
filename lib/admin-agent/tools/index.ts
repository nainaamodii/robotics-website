import { tool } from "@langchain/core/tools";
import {
  getUsersAdminSchema,
  getUserByIdAdminSchema,
  getTeamsAdminSchema,
  getTeamByIdAdminSchema,
  getProjectsAdminSchema,
  getProjectByIdAdminSchema,
  getEventsAdminSchema,
  getEventByIdAdminSchema,
  getCompetitionByIdAdminSchema,
  getCompetitionsAdminSchema,
  getInvitationsAdminSchema,
  getJoinRequestsAdminSchema,
  getMediaAdminSchema,
  getSiteContentAdminSchema,
} from "./schemas";
import {
  getUsersAdmin,
  getUserByIdAdmin,
  getTeamsAdmin,
  getTeamByIdAdmin,
  getProjectsAdmin,
  getProjectByIdAdmin,
  getEventsAdmin,
  getEventByIdAdmin,
  getCompetitionByIdAdmin,
  getCompetitionsAdmin,
  getInvitationsAdmin,
  getJoinRequestsAdmin,
  getMediaAdmin,
  getSiteContentAdmin,
} from "./admin-resolvers";

// Hard cap per tool result, independent of how slim the shaping functions
// are — this is defense in depth, not the primary fix (the primary fix is
// the list/detail split in admin-resolvers.ts). Without SOME cap, a single
// pathological result (e.g. a project with a very long `content` field)
// could still dominate the ReAct loop's growing context on every subsequent
// step.
const MAX_RESULT_CHARS = 2500;

function serialized<Args, R>(fn: (args: Args) => Promise<R>, name: string) {
  return async (args: Args): Promise<string> => {
    const result = await fn(args);
    if (result === null || result === undefined) return "null";
    if (Array.isArray(result) && result.length === 0) {
      return JSON.stringify({ results: [], message: "No results found." });
    }
    const json = JSON.stringify(result);
    if (json.length > MAX_RESULT_CHARS) {
      return json.slice(0, MAX_RESULT_CHARS) + `... [truncated, ${json.length} chars total — narrow your query with more filters or a smaller limit]`;
    }
    return json;
  };
}

export const adminDbTools = [
  // ---- LIST tools: slim fields, cheap, use these first ----
  tool(serialized(getUsersAdmin, "getUsersAdmin"), {
    name: "getUsersAdmin",
    description:
      "List members (slim: id/name/email/role/codename only). Filter by role, department, or name/email/codename substring. Pass countOnly:true for 'how many' questions.",
    schema: getUsersAdminSchema,
  }),
  tool(serialized(getTeamsAdmin, "getTeamsAdmin"), {
    name: "getTeamsAdmin",
    description:
      "List teams (slim: id/name/approvalStatus/competitionId only). Filter by competition and/or approval status (draft/submitted/approved/rejected). Use for 'which teams haven't submitted' etc. Pass countOnly:true for 'how many' questions. For a specific team's leader/members, use getTeamByIdAdmin instead — it resolves both to real names/emails in one call.",
    schema: getTeamsAdminSchema,
  }),
  tool(serialized(getProjectsAdmin, "getProjectsAdmin"), {
    name: "getProjectsAdmin",
    description:
      "List projects (slim: id/title/category/published/featured only), including unpublished drafts. Filter by published status or category. Pass countOnly:true for 'how many' questions. For full detail on one project (description, tech stack, contributors, links), use getProjectByIdAdmin.",
    schema: getProjectsAdminSchema,
  }),
  tool(serialized(getEventsAdmin, "getEventsAdmin"), {
    name: "getEventsAdmin",
    description:
      "List events (slim: id/name/year/isActive only). Filter by year or active status. Pass countOnly:true for 'how many' questions. For an event's competitions, use getEventByIdAdmin instead of a separate lookup.",
    schema: getEventsAdminSchema,
  }),
  tool(serialized(getCompetitionsAdmin, "getCompetitionsAdmin"), {
    name: "getCompetitionsAdmin",
    description:
      "List competitions (slim: id/title/type/registrationOpen only). Filter by event or registration-open status. Pass countOnly:true for 'how many' questions. For a competition's teams, use getCompetitionByIdAdmin instead of a separate lookup.",
    schema: getCompetitionsAdminSchema,
  }),
  tool(serialized(getInvitationsAdmin, "getInvitationsAdmin"), {
    name: "getInvitationsAdmin",
    description: "List team invitations (slim). Filter by team or status. Pass countOnly:true for 'how many' questions.",
    schema: getInvitationsAdminSchema,
  }),
  tool(serialized(getJoinRequestsAdmin, "getJoinRequestsAdmin"), {
    name: "getJoinRequestsAdmin",
    description: "List team join requests (slim). Filter by team or status. Pass countOnly:true for 'how many' questions.",
    schema: getJoinRequestsAdminSchema,
  }),
  tool(serialized(getMediaAdmin, "getMediaAdmin"), {
    name: "getMediaAdmin",
    description: "List recent uploaded media (slim: id/filename/mimeType/createdAt). Pass countOnly:true for 'how many' questions.",
    schema: getMediaAdminSchema,
  }),

  // ---- DETAIL tools: one record, full fields, relations resolved ----
  tool(serialized(getUserByIdAdmin, "getUserByIdAdmin"), {
    name: "getUserByIdAdmin",
    description: "Full admin-visible profile for one member by id (department, phone, bio, etc. — beyond what the list view gives you).",
    schema: getUserByIdAdminSchema,
  }),
  tool(serialized(getTeamByIdAdmin, "getTeamByIdAdmin"), {
    name: "getTeamByIdAdmin",
    description:
      "Full detail for one team by id, INCLUDING the leader's and every member's actual name and email (already resolved — do not call getUserByIdAdmin per member, this tool already did that in one query). Also includes rejection reason if rejected.",
    schema: getTeamByIdAdminSchema,
  }),
  tool(serialized(getProjectByIdAdmin, "getProjectByIdAdmin"), {
    name: "getProjectByIdAdmin",
    description: "Full detail for one project by id: description, tech stack, achievements, links, contributors, mentors.",
    schema: getProjectByIdAdminSchema,
  }),
  tool(serialized(getEventByIdAdmin, "getEventByIdAdmin"), {
    name: "getEventByIdAdmin",
    description: "Full detail for one event by id, INCLUDING its competitions already resolved to title/type/status (do not call getCompetitionsAdmin separately for this).",
    schema: getEventByIdAdminSchema,
  }),
  tool(serialized(getCompetitionByIdAdmin, "getCompetitionByIdAdmin"), {
    name: "getCompetitionByIdAdmin",
    description: "Full detail for one competition by id, INCLUDING its teams already resolved to name/approvalStatus (do not call getTeamsAdmin separately for this).",
    schema: getCompetitionByIdAdminSchema,
  }),
  tool(serialized(getSiteContentAdmin, "getSiteContentAdmin"), {
    name: "getSiteContentAdmin",
    description: "CMS content for a specific site section by its sectionId.",
    schema: getSiteContentAdminSchema,
  }),
];