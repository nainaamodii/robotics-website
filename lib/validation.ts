/**
 * Zod schemas for every request body the API accepts.
 *
 * Rules of thumb applied here:
 *   - Every string has a max length (prevent 10MB payloads)
 *   - Every array has a max size (prevent 1M-element arrays)
 *   - IDs use a strict 24-hex-char regex (MongoDB ObjectId shape) — rejects garbage before it hits the DB
 *   - Enums instead of open strings where possible (dept, category, etc.)
 *   - `.default(...)` for optional-with-default fields, so downstream code never sees undefined
 *
 * Each schema doubles as a TypeScript type via `z.infer<typeof Schema>`.
 */
import { z } from 'zod'

/** MongoDB ObjectId shape — 24 hex characters. */
export const ObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format')

// ────────────────────────────────────────────────────────────
// USER
// ────────────────────────────────────────────────────────────

export const SignupSchema = z.object({
  email: z.string().email().max(200).toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  name: z.string().min(1).max(100).trim(),
  rollNo: z.string().max(20).trim().optional(),
  department: z.string().min(1).max(100).trim(),
})
export type SignupInput = z.infer<typeof SignupSchema>

export const SigninSchema = z.object({
  email: z.string().email().max(200).toLowerCase().trim(),
  password: z.string().min(1).max(100),
})
export type SigninInput = z.infer<typeof SigninSchema>

/**
 * Codename format: 3-20 chars, alphanumeric + underscore. No leading digit.
 * Stored lowercase for case-insensitive uniqueness — display can be Title Case
 * on the frontend if we ever care.
 */
export const CodenameSchema = z
  .string()
  .min(3, 'Codename must be at least 3 characters')
  .max(20, 'Codename can be at most 20 characters')
  .regex(
    /^[a-zA-Z][a-zA-Z0-9_]*$/,
    'Codename must start with a letter and contain only letters, digits, or underscore',
  )
  .transform((s) => s.toLowerCase())

export const SetCodenameSchema = z.object({ codename: CodenameSchema })
export type SetCodenameInput = z.infer<typeof SetCodenameSchema>

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    rollNo: z.string().max(20).trim().optional(),
    department: z.string().max(100).trim().optional(),
    phone: z
      .string()
      .max(20)
      .regex(/^[+\d\s\-()]*$/, 'Invalid phone number')
      .optional(),
    college: z.string().max(200).trim().optional(),
    isMnnit: z.boolean().optional(),
    isProfileComplete: z.boolean().optional(),
    profileImage: z.string().url().max(500).optional(),
    bio: z.string().max(1000).optional(),
  })
  .strict()
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

export const CompleteProfileSchema = z.object({
  phone: z.string().min(1, 'Phone number is required').max(20).regex(/^[+\d\s\-()]*$/, 'Invalid phone number'),
  branch: z.string().min(1, 'Branch is required').max(100).trim(),
  isMnnit: z.boolean(),
  rollNo: z.string().max(20).trim().optional(),
  college: z.string().max(200).trim().optional(),
  codename: CodenameSchema.optional(),
}).refine(
  (d) => !d.isMnnit || (d.rollNo && d.rollNo.length > 0),
  { message: 'Registration number is required for MNNIT students', path: ['rollNo'] },
).refine(
  (d) => d.isMnnit || (d.college && d.college.length > 0),
  { message: 'College name is required', path: ['college'] },
)
export type CompleteProfileInput = z.infer<typeof CompleteProfileSchema>

// ────────────────────────────────────────────────────────────
// ADMIN
// ────────────────────────────────────────────────────────────

export const AdminAuthSchema = z.object({
  password: z.string().min(1).max(200),
})
export type AdminAuthInput = z.infer<typeof AdminAuthSchema>

// ────────────────────────────────────────────────────────────
// PROJECT
// ────────────────────────────────────────────────────────────

const ContributorSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  role: z.string().min(1).max(100).trim(),
  github: z.string().url().max(300).optional(),
})

const LinksSchema = z
  .object({
    github: z.string().url().max(300).optional(),
    documentation: z.string().url().max(300).optional(),
    demo: z.string().url().max(300).optional(),
  })
  .default({})

export const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(2000),
  shortDescription: z.string().min(1).max(300),
  category: z.string().min(1).max(100).trim(),
  image: z.string().url().max(500).optional().or(z.literal('')),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  hardwareUsed: z.array(z.string().max(100)).max(50).default([]),
  softwareUsed: z.array(z.string().max(100)).max(50).default([]),
  techStack: z.array(z.string().max(100)).max(50).default([]),
  contributors: z.array(ContributorSchema).max(100).default([]),
  mentors: z.array(ContributorSchema).max(20).default([]),
  content: z.string().max(50_000).default(''),
  achievements: z.array(z.string().max(300)).max(50).default([]),
  links: LinksSchema,
})
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>

export const UpdateProjectSchema = CreateProjectSchema.partial().strict()
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>

export const ProjectPatchActionSchema = z.object({
  action: z.enum(['togglePublished']),
})

// ────────────────────────────────────────────────────────────
// EVENT
// ────────────────────────────────────────────────────────────

/**
 * Client sends YYYY-MM-DD from an <input type="date">. We format a display
 * string like "OCT 24-26, 2026" for the UI and derive the year on the backend
 * so the frontend doesn't need to know either detail.
 *
 * Handles three cases:
 *   - same month + year:     "OCT 24-26, 2026"
 *   - same day:              "OCT 24, 2026"
 *   - crosses month or year: "OCT 30 - NOV 2, 2026"
 */
function formatEventDate(startISO: string, endISO: string): string {
  const s = new Date(startISO)
  const e = new Date(endISO)
  const monthS = s.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const monthE = e.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const dS = s.getDate()
  const dE = e.getDate()
  const yS = s.getFullYear()
  const yE = e.getFullYear()

  if (yS === yE && s.getMonth() === e.getMonth()) {
    if (dS === dE) return `${monthS} ${dS}, ${yS}`
    return `${monthS} ${dS}-${dE}, ${yS}`
  }
  if (yS === yE) return `${monthS} ${dS} - ${monthE} ${dE}, ${yS}`
  return `${monthS} ${dS}, ${yS} - ${monthE} ${dE}, ${yE}`
}

function isRealCalendarDate(s: string): boolean {
  const d = new Date(`${s}T00:00:00.000Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

/** Accepts an <input type="date"> value: "YYYY-MM-DD". */
const ISODateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)')
  .refine(isRealCalendarDate, 'Must be a real calendar date')

export const CreateEventSchema = z
  .object({
    name: z.string().min(1).max(200).trim(),
    startDate: ISODateSchema,
    endDate: ISODateSchema,
    theme: z.string().max(200).default(''),
    tagline: z.string().max(300).default(''),
    description: z.string().max(5000).default(''),
    location: z.string().max(200).default(''),
    participantsLabel: z.string().max(100).default(''),
    // New events start as drafts; an admin publishes them explicitly.
    published: z.boolean().default(false),
    highlights: z.array(z.string().max(200)).max(20).default([]),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })
  // Derive year + display date server-side so the frontend can stop sending
  // them. The DB doc keeps all four (startDate, endDate, year, date) for
  // easy querying + display.
  .transform((d) => ({
    ...d,
    year: new Date(d.startDate).getFullYear(),
    date: formatEventDate(d.startDate, d.endDate),
  }))
export type CreateEventInput = z.infer<typeof CreateEventSchema>

// Update: partial version. If BOTH dates are provided, still enforce ordering
// and re-derive year + date. Anything else is a plain field patch.
export const UpdateEventSchema = z
  .object({
    name: z.string().min(1).max(200).trim().optional(),
    startDate: ISODateSchema.optional(),
    endDate: ISODateSchema.optional(),
    theme: z.string().max(200).optional(),
    tagline: z.string().max(300).optional(),
    description: z.string().max(5000).optional(),
    location: z.string().max(200).optional(),
    participantsLabel: z.string().max(100).optional(),
    published: z.boolean().optional(),
    highlights: z.array(z.string().max(200)).max(20).optional(),
  })
  .strict()
  .refine(
    (d) =>
      !(d.startDate && d.endDate) ||
      new Date(d.endDate) >= new Date(d.startDate),
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  )
  .transform((d) => {
    if (d.startDate && d.endDate) {
      return {
        ...d,
        year: new Date(d.startDate).getFullYear(),
        date: formatEventDate(d.startDate, d.endDate),
      }
    }
    return d
  })
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>

// ────────────────────────────────────────────────────────────
// COMPETITION
// ────────────────────────────────────────────────────────────

export const CreateCompetitionSchema = z
  .object({
    eventId: ObjectIdSchema,
    title: z.string().min(1).max(200).trim(),
    type: z.string().max(100).default(''),
    description: z.string().max(5000).default(''),
    minTeamSize: z.number().int().min(1).max(20),
    maxTeamSize: z.number().int().min(1).max(20),
    rules: z.array(z.string().max(1000)).max(50).default([]),
    registrationOpen: z.boolean().default(false),
  })
  .refine((d) => d.maxTeamSize >= d.minTeamSize, {
    message: 'maxTeamSize must be >= minTeamSize',
    path: ['maxTeamSize'],
  })
export type CreateCompetitionInput = z.infer<typeof CreateCompetitionSchema>


export const UpdateCompetitionSchema = z
  .object({
    title: z.string().min(1).max(200).trim().optional(),
    type: z.string().max(100).optional(),
    description: z.string().max(5000).optional(),
    minTeamSize: z.number().int().min(1).max(20).optional(),
    maxTeamSize: z.number().int().min(1).max(20).optional(),
    rules: z.array(z.string().max(1000)).max(50).optional(),
    registrationOpen: z.boolean().optional(),
  })
  .strict()
  // If BOTH sizes are provided in an update, enforce max >= min. If only one
  // is provided we can't validate against the existing doc here (would need
  // a DB read); good enough for MVP.
  .refine(
    (d) =>
      d.minTeamSize === undefined ||
      d.maxTeamSize === undefined ||
      d.maxTeamSize >= d.minTeamSize,
    { message: 'maxTeamSize must be >= minTeamSize', path: ['maxTeamSize'] },
  )
export type UpdateCompetitionInput = z.infer<typeof UpdateCompetitionSchema>

// ────────────────────────────────────────────────────────────
// ADMIN — TEAM APPROVAL
// ────────────────────────────────────────────────────────────

/** Body for POST /api/admin/teams/[id]/reject — optional reason string. */
export const RejectTeamSchema = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .strict()
export type RejectTeamInput = z.infer<typeof RejectTeamSchema>

/** Query param helper for GET /api/admin/teams?status=... */
export const TeamStatusQuery = z.enum(['draft', 'submitted', 'approved', 'rejected'])

/** Body for POST /api/teams/[id]/transfer-leadership */
export const TransferLeadershipSchema = z.object({
  newLeaderId: ObjectIdSchema,
})
export type TransferLeadershipInput = z.infer<typeof TransferLeadershipSchema>

/** Body for POST /api/auth/forgot-password — just email. */
export const ForgotPasswordSchema = z.object({
  email: z.string().email().max(200).toLowerCase().trim(),
})
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>

/** Body for POST /api/auth/reset-password — token + new password. */
export const ResetPasswordSchema = z.object({
  token: z.string().min(32).max(200),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
})
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>

// ────────────────────────────────────────────────────────────
// PROJECT ↔ TEAM ASSIGNMENT
// ────────────────────────────────────────────────────────────

export const AssignTeamToProjectSchema = z.object({
  teamId: ObjectIdSchema,
})
export type AssignTeamToProjectInput = z.infer<typeof AssignTeamToProjectSchema>

// ────────────────────────────────────────────────────────────
// INVITATIONS
// ────────────────────────────────────────────────────────────

/**
 * Body for POST /api/teams/[id]/invitations.
 * Accepts EITHER `{ invitedUser: <userId> }` OR `{ email: "..." }` — the route
 * resolves email → userId via a users-collection lookup.
 * Callers who don't know the user's ObjectId (99% of real UX) can just pass email.
 */
export const SendInvitationSchema = z.union([
  z.object({ invitedUser: ObjectIdSchema }),
  z.object({
    email: z.string().email().max(200).toLowerCase().trim(),
  }),
  z.object({
    codename: CodenameSchema, // lowercased by the schema
  }),
])
export type SendInvitationInput = z.infer<typeof SendInvitationSchema>

// ────────────────────────────────────────────────────────────
// PARTICIPATE (team create/join)
// ────────────────────────────────────────────────────────────

export const ParticipateSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('CREATE'),
    competitionId: ObjectIdSchema,
    teamName: z.string().min(1).max(100).trim(),
  }),
  z.object({
    action: z.literal('JOIN'),
    competitionId: ObjectIdSchema.optional(),
    teamCode: z.string().min(1).max(20).trim().toUpperCase(),
  }),
])
export type ParticipateInput = z.infer<typeof ParticipateSchema>
