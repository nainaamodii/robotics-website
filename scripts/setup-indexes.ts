/**
 * Create all MongoDB indexes the app depends on.
 *
 * Run once after deploy (or any time the schema evolves):
 *   npx tsx scripts/setup-indexes.ts
 *
 * `createIndex` is idempotent — running it again on an existing index is a no-op.
 * Safe to run in CI/CD as part of the deploy step.
 *
 * WHY EACH INDEX EXISTS:
 *   - unique indexes give us race-safe uniqueness at the DB layer, so
 *     application-level "does this exist?" checks aren't security-critical.
 *   - non-unique indexes accelerate frequent queries; without them, MongoDB
 *     does full collection scans that fall over at even modest data volumes.
 *
 * Compound-index ordering rule: prefix matters, left-to-right. The order below
 * is chosen so the most common query patterns hit the index.
 */
import { getDB } from '../lib/db'

async function main() {
  const db = await getDB()

  const jobs: Array<{ collection: string; spec: any; options?: any; reason: string }> = [
    // ──────── USERS ────────
    {
      collection: 'users',
      spec: { email: 1 },
      options: { unique: true },
      reason: 'unique email + fast getUserByEmail (signin)',
    },
    {
      collection: 'users',
      spec: { googleId: 1 },
      // Sparse: only index docs that HAVE googleId. Password-only users have
      // no googleId field and won't collide on `null`.
      options: { unique: true, sparse: true },
      reason: 'unique Google subject id + fast repeat-Google signin',
    },
    {
      collection: 'users',
      spec: { codename: 1 },
      options: { unique: true, sparse: true },
      reason: 'unique codename + prefix search (invite-by-codename)',
    },

    // ──────── TEAMS ────────
    {
      collection: 'teams',
      spec: { teamCode: 1 },
      options: { unique: true },
      reason: 'unique team code + fast joinTeamByCode',
    },
    {
      collection: 'teams',
      spec: { competitionId: 1 },
      reason: 'list teams for a competition (admin views)',
    },
    {
      // Multikey compound + unique — MongoDB indexes each (competitionId, memberId)
      // pair as a separate entry. Result: a user cannot appear in members[] on
      // two different teams in the same competition. Race-safe: if two concurrent
      // join/accept requests would violate the rule, one fails with E11000 and
      // the model layer translates it to a ConflictError.
      collection: 'teams',
      spec: { competitionId: 1, members: 1 },
      options: { unique: true, name: 'unique_member_per_competition' },
      reason: 'race-safe: a user can only be on one team per competition',
    },
    {
      collection: 'teams',
      spec: { leaderId: 1 },
      reason: 'find teams a user leads (finalize permission checks)',
    },
    {
      collection: 'teams',
      // multikey index — MongoDB creates one entry per array element
      spec: { members: 1 },
      reason: 'find teams a user is on (getAllTeamsForUser aggregation)',
    },
    {
      collection: 'teams',
      spec: { members: 1, createdAt: -1 },
      reason: 'user-teams sorted newest-first (getLatestTeamForUser + getAllTeamsForUser)',
    },
    {
      collection: 'teams',
      spec: { approvalStatus: 1, submittedAt: -1 },
      reason: 'admin review queue: submitted teams newest-first',
    },

    {
      // Partial: only teams that carry a nameKey (created after this change) are
      // indexed, so pre-existing teams with duplicate names can't block index creation.
      collection: 'teams',
      spec: { competitionId: 1, nameKey: 1 },
      options: {
        unique: true,
        partialFilterExpression: { nameKey: { $exists: true } },
        name: 'unique_team_name_per_competition',
      },
      reason: 'race-safe: team names are unique (case-insensitive) within a competition',
    },

    // ──────── PROJECTS ────────
    {
      collection: 'projects',
      spec: { published: 1, featured: 1, createdAt: -1 },
      reason: 'landing page: featured+published sorted newest-first',
    },
    {
      collection: 'projects',
      spec: { category: 1, published: 1 },
      reason: 'category page: getProjectsByCategory',
    },
    {
      collection: 'projects',
      spec: { published: 1, createdAt: -1 },
      reason: 'general "published projects newest first" listings',
    },
    {
      collection: 'projects',
      spec: { teamIds: 1 },
      reason: 'reverse lookup: which projects is this team assigned to',
    },

    // ──────── COMPETITIONS ────────
    {
      collection: 'competitions',
      spec: { eventId: 1 },
      reason: 'list competitions for an event',
    },

    // ──────── MEDIA ────────
    {
      collection: 'media',
      spec: { uploadedBy: 1, createdAt: -1 },
      reason: 'user media library, newest first',
    },
    {
      collection: 'media',
      spec: { cloudinaryPublicId: 1 },
      options: { unique: true },
      reason: 'unique cloud asset + fast deleteByPublicId',
    },

    // ──────── JOIN REQUESTS ────────
    {
      collection: 'join_requests',
      spec: { userId: 1, status: 1, createdAt: -1 },
      reason: 'user "my requests" listing',
    },
    {
      collection: 'join_requests',
      spec: { teamId: 1, status: 1 },
      reason: 'leader inbox — list pending requests for a team',
    },
    {
      collection: 'join_requests',
      spec: { teamId: 1, userId: 1 },
      options: {
        unique: true,
        partialFilterExpression: { status: 'pending' },
        name: 'unique_pending_join_request',
      },
      reason: 'race-safe: at most one pending request per (team, user)',
    },

    // ──────── INVITATIONS ────────
    {
      collection: 'invitations',
      spec: { invitedUser: 1, status: 1, createdAt: -1 },
      reason: 'pending-invites-for-user query (getPendingInvitationsForUser)',
    },
    {
      collection: 'invitations',
      // Partial unique index — prevents duplicate pending invites for the same
      // (team, user) pair, but ALLOWS a fresh invite after rejection.
      spec: { teamId: 1, invitedUser: 1 },
      options: {
        unique: true,
        partialFilterExpression: { status: 'pending' },
        name: 'unique_pending_invite',
      },
      reason: 'race-safe: at most one pending invite per (team, user)',
    },
    {
      collection: 'invitations',
      spec: { teamId: 1, status: 1 },
      reason: 'list invites for a team (leader-facing views)',
    },

    // ──────── PASSWORD RESETS ────────
    {
      collection: 'password_resets',
      spec: { tokenHash: 1 },
      options: { unique: true },
      reason: 'unique + fast consumeResetToken lookup',
    },
    {
      collection: 'password_resets',
      spec: { userId: 1, createdAt: -1 },
      reason: 'find outstanding tokens for a user (rate limit + invalidation)',
    },
    {
      collection: 'password_resets',
      spec: { expiresAt: 1 },
      // TTL index — MongoDB auto-deletes expired tokens after this many seconds.
      // Value 0 means "as soon as expiresAt passes". Cleaner than a cron job.
      options: { expireAfterSeconds: 0 },
      reason: 'auto-expire consumed/stale reset tokens',
    },

    // ──────── EVENTS ────────
    {
      collection: 'events',
      spec: { name: 1 },
      options: { unique: true },
      reason: 'unique event name + fast getEventByName',
    },
    {
      collection: 'events',
      spec: { published: 1, createdAt: -1 },
      reason: 'public listing of published events / admin listing newest-first',
    },
    {
      collection: 'events',
      spec: { isActive: 1, year: -1 },
      reason: 'active events listing sorted by year',
    },
  ]

  console.log(`\nSetting up ${jobs.length} indexes on '${db.databaseName}'...\n`)

  for (const job of jobs) {
    try {
      const name = await db.collection(job.collection).createIndex(job.spec, job.options)
      console.log(`  ✓ ${job.collection}.${name}  — ${job.reason}`)
    } catch (err: any) {
      console.error(
        `  ✗ ${job.collection}  spec=${JSON.stringify(job.spec)}  error: ${err.message}`,
      )
      // Don't abort — keep going so we report every failure at once.
    }
  }

  console.log('\nDone.\n')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Index setup failed:', err)
    process.exit(1)
  })
