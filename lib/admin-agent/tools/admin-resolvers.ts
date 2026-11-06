import { ObjectId } from "mongodb";
import { getDB } from "@/lib/db";
import type {
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

// ============================================================================
// SLIM shaping — list-view fields only. Deliberately terse: these are what
// get re-transmitted on every subsequent step of the ReAct retrieval loop,
// so every extra field here is a recurring token cost, not a one-time one.
// ============================================================================

function toSlimUser(doc: any) {
  return { id: doc._id.toString(), name: doc.name, email: doc.email, role: doc.role ?? "user", codename: doc.codename };
}
function toSlimTeam(doc: any) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    approvalStatus: doc.approvalStatus,
    competitionId: doc.competitionId?.toString(),
    isFinalized: doc.isFinalized,
  };
}
function toSlimProject(doc: any) {
  return { id: doc._id.toString(), title: doc.title, category: doc.category, published: doc.published, featured: doc.featured };
}
function toSlimEvent(doc: any) {
  return { id: doc._id.toString(), name: doc.name, year: doc.year, isActive: doc.isActive };
}
function toSlimCompetition(doc: any) {
  return { id: doc._id.toString(), title: doc.title, type: doc.type, registrationOpen: doc.registrationOpen };
}
function toSlimInvitation(doc: any) {
  return { id: doc._id.toString(), teamId: doc.teamId?.toString(), invitedUser: doc.invitedUser?.toString(), status: doc.status };
}
function toSlimJoinRequest(doc: any) {
  return { id: doc._id.toString(), teamId: doc.teamId?.toString(), userId: doc.userId?.toString(), status: doc.status };
}
function toSlimMedia(doc: any) {
  return { id: doc._id.toString(), filename: doc.filename, mimeType: doc.mimeType, createdAt: doc.createdAt };
}

// ============================================================================
// FULL shaping — single-record detail views. Allowlisted, same security
// boundary as before (password/tokenHash never included regardless of
// role). Relations get resolved into real names/emails here, not left as
// raw ObjectId strings the model would need another tool call to resolve.
// ============================================================================

function toFullUser(doc: any) {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    rollNo: doc.rollNo,
    department: doc.department,
    phone: doc.phone,
    bio: doc.bio,
    role: doc.role ?? "user",
    codename: doc.codename,
    createdAt: doc.createdAt,
  };
}

function toFullProject(doc: any) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    shortDescription: doc.shortDescription,
    category: doc.category,
    published: doc.published,
    featured: doc.featured,
    techStack: doc.techStack,
    hardwareUsed: doc.hardwareUsed,
    softwareUsed: doc.softwareUsed,
    achievements: doc.achievements,
    links: doc.links,
    contributors: doc.contributors,
    mentors: doc.mentors,
    teamIds: (doc.teamIds ?? []).map((t: any) => t.toString()),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function personRef(userId: any, usersById: Map<string, any>) {
  if (!userId) return null;
  const u = usersById.get(userId.toString());
  return u ? { id: userId.toString(), name: u.name, email: u.email } : { id: userId.toString(), name: null, email: null };
}

// ============================================================================
// LIST resolvers — each supports countOnly for cheap aggregate questions
// ("how many teams are draft") without ever fetching full documents.
// ============================================================================

export async function getUsersAdmin(args: typeof getUsersAdminSchema._type) {
  const db = await getDB();
  const filter: Record<string, unknown> = {};
  if (args.role) filter.role = args.role;
  if (args.department) filter.department = args.department;
  if (args.search) {
    const re = new RegExp(args.search, "i");
    filter.$or = [{ name: re }, { email: re }, { codename: re }];
  }
  if (args.countOnly) return { count: await db.collection("users").countDocuments(filter) };
  const docs = await db.collection("users").find(filter).limit(args.limit).toArray();
  return docs.map(toSlimUser);
}

export async function getUserByIdAdmin(args: typeof getUserByIdAdminSchema._type) {
  const db = await getDB();
  const doc = await db.collection("users").findOne({ _id: new ObjectId(args.id) });
  return doc ? toFullUser(doc) : null;
}

export async function getTeamsAdmin(args: typeof getTeamsAdminSchema._type) {
  const db = await getDB();
  const filter: Record<string, unknown> = {};
  if (args.competitionId) filter.competitionId = new ObjectId(args.competitionId);
  if (args.approvalStatus) filter.approvalStatus = args.approvalStatus;
  if (args.countOnly) return { count: await db.collection("teams").countDocuments(filter) };
  const docs = await db.collection("teams").find(filter).limit(args.limit).toArray();
  return docs.map(toSlimTeam);
}

// Full team detail WITH leader and members resolved to real name/email in
// the same call — this directly fixes the "who are the team members" gap:
// previously nothing resolved `members: ObjectId[]` to actual people at all.
export async function getTeamByIdAdmin(args: typeof getTeamByIdAdminSchema._type) {
  const db = await getDB();
  const doc = await db.collection("teams").findOne({ _id: new ObjectId(args.id) });
  if (!doc) return null;

  const userIds: ObjectId[] = [doc.leaderId, ...(doc.members ?? [])].filter(Boolean);
  const userDocs = userIds.length
    ? await db.collection("users").find({ _id: { $in: userIds } }).project({ name: 1, email: 1 }).toArray()
    : [];
  const usersById = new Map(userDocs.map((u: any) => [u._id.toString(), u]));

  return {
    id: doc._id.toString(),
    name: doc.name,
    teamCode: doc.teamCode,
    competitionId: doc.competitionId?.toString(),
    leader: await personRef(doc.leaderId, usersById),
    members: await Promise.all((doc.members ?? []).map((m: any) => personRef(m, usersById))),
    isFinalized: doc.isFinalized,
    approvalStatus: doc.approvalStatus,
    createdAt: doc.createdAt,
    submittedAt: doc.submittedAt,
    approvedAt: doc.approvedAt,
    rejectedAt: doc.rejectedAt,
    rejectedReason: doc.rejectedReason,
  };
}

export async function getProjectsAdmin(args: typeof getProjectsAdminSchema._type) {
  const db = await getDB();
  const filter: Record<string, unknown> = {};
  if (args.published !== undefined) filter.published = args.published;
  if (args.category) filter.category = args.category;
  if (args.countOnly) return { count: await db.collection("projects").countDocuments(filter) };
  const docs = await db.collection("projects").find(filter).limit(args.limit).toArray();
  return docs.map(toSlimProject);
}

export async function getProjectByIdAdmin(args: typeof getProjectByIdAdminSchema._type) {
  const db = await getDB();
  const doc = await db.collection("projects").findOne({ _id: new ObjectId(args.id) });
  return doc ? toFullProject(doc) : null;
}

export async function getEventsAdmin(args: typeof getEventsAdminSchema._type) {
  const db = await getDB();
  const filter: Record<string, unknown> = {};
  if (args.year) filter.year = args.year;
  if (args.activeOnly) filter.isActive = true;
  if (args.countOnly) return { count: await db.collection("events").countDocuments(filter) };
  const docs = await db.collection("events").find(filter).limit(args.limit).toArray();
  return docs.map(toSlimEvent);
}

// Full event detail WITH its competitions resolved to name/type/status
// instead of raw ObjectId strings.
export async function getEventByIdAdmin(args: typeof getEventByIdAdminSchema._type) {
  const db = await getDB();
  const doc = await db.collection("events").findOne({ _id: new ObjectId(args.id) });
  if (!doc) return null;

  const competitions = (doc.competitions ?? []).length
    ? await db
        .collection("competitions")
        .find({ _id: { $in: doc.competitions } })
        .project({ title: 1, type: 1, registrationOpen: 1 })
        .toArray()
    : [];

  return {
    id: doc._id.toString(),
    name: doc.name,
    year: doc.year,
    startDate: doc.startDate,
    endDate: doc.endDate,
    theme: doc.theme,
    description: doc.description,
    location: doc.location,
    isActive: doc.isActive,
    competitions: competitions.map((c: any) => ({ id: c._id.toString(), title: c.title, type: c.type, registrationOpen: c.registrationOpen })),
    createdAt: doc.createdAt,
  };
}

export async function getCompetitionByIdAdmin(args: typeof getCompetitionByIdAdminSchema._type) {
  const db = await getDB();
  const doc = await db.collection("competitions").findOne({ _id: new ObjectId(args.id) });
  if (!doc) return null;

  const teams = (doc.teams ?? []).length
    ? await db
        .collection("teams")
        .find({ _id: { $in: doc.teams } })
        .project({ name: 1, approvalStatus: 1 })
        .toArray()
    : [];

  return {
    id: doc._id.toString(),
    eventId: doc.eventId?.toString(),
    title: doc.title,
    type: doc.type,
    description: doc.description,
    minTeamSize: doc.minTeamSize,
    maxTeamSize: doc.maxTeamSize,
    rules: doc.rules,
    registrationOpen: doc.registrationOpen,
    teams: teams.map((t: any) => ({ id: t._id.toString(), name: t.name, approvalStatus: t.approvalStatus })),
  };
}

export async function getCompetitionsAdmin(args: typeof getCompetitionsAdminSchema._type) {
  const db = await getDB();
  const filter: Record<string, unknown> = {};
  if (args.eventId) filter.eventId = new ObjectId(args.eventId);
  if (args.registrationOpen !== undefined) filter.registrationOpen = args.registrationOpen;
  if (args.countOnly) return { count: await db.collection("competitions").countDocuments(filter) };
  const docs = await db.collection("competitions").find(filter).limit(args.limit).toArray();
  return docs.map(toSlimCompetition);
}

export async function getInvitationsAdmin(args: typeof getInvitationsAdminSchema._type) {
  const db = await getDB();
  const filter: Record<string, unknown> = {};
  if (args.teamId) filter.teamId = new ObjectId(args.teamId);
  if (args.status) filter.status = args.status;
  if (args.countOnly) return { count: await db.collection("invitations").countDocuments(filter) };
  const docs = await db.collection("invitations").find(filter).limit(args.limit).toArray();
  return docs.map(toSlimInvitation);
}

export async function getJoinRequestsAdmin(args: typeof getJoinRequestsAdminSchema._type) {
  const db = await getDB();
  const filter: Record<string, unknown> = {};
  if (args.teamId) filter.teamId = new ObjectId(args.teamId);
  if (args.status) filter.status = args.status;
  if (args.countOnly) return { count: await db.collection("join_requests").countDocuments(filter) };
  const docs = await db.collection("join_requests").find(filter).limit(args.limit).toArray();
  return docs.map(toSlimJoinRequest);
}

export async function getMediaAdmin(args: typeof getMediaAdminSchema._type) {
  const db = await getDB();
  if (args.countOnly) return { count: await db.collection("media").countDocuments({}) };
  const docs = await db.collection("media").find({}).sort({ createdAt: -1 }).limit(args.limit).toArray();
  return docs.map(toSlimMedia);
}

export async function getSiteContentAdmin(args: typeof getSiteContentAdminSchema._type) {
  const db = await getDB();
  const doc = await db.collection("site_content").findOne({ sectionId: args.sectionId });
  return doc ? { id: doc._id.toString(), sectionId: doc.sectionId, content: doc.content, updatedAt: doc.updatedAt } : null;
}

// password_resets is deliberately not exposed as a tool at all — see the
// original note: tokenHash is a live credential, no legitimate
// conversational-agent use case needs it.