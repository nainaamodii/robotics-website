import { ObjectId } from 'mongodb'
import { getDB } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/errors'

export interface Contributor {
  name: string
  role: string
  github?: string
}

export interface Project {
  _id?: ObjectId
  title: string
  description: string
  shortDescription: string
  category: string
  image?: string
  featured: boolean
  published: boolean
  createdAt: Date
  updatedAt: Date
  hardwareUsed: string[]
  softwareUsed: string[]
  techStack: string[]
  contributors: Contributor[]
  mentors: Contributor[]
  content: string
  achievements: string[]
  links: {
    github?: string
    documentation?: string
    demo?: string
  }
  // Teams officially assigned to this project. Distinct from `contributors`
  // (free-text list) — teamIds are real Team documents in the DB.
  teamIds?: ObjectId[]
}

export async function createProject(projectData: Omit<Project, '_id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDB()

  const newProject: Project = {
    ...projectData,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection('projects').insertOne(newProject)
  return { ...newProject, _id: result.insertedId }
}

export async function getProjectById(id: string | ObjectId) {
  const db = await getDB()
  return db.collection('projects').findOne({ _id: new ObjectId(id) })
}

export async function getAllProjects() {
  const db = await getDB()
  return db.collection('projects').find({}).toArray()
}

export async function getPublishedProjects() {
  const db = await getDB()
  return db.collection('projects').find({ published: true }).toArray()
}

export async function getFeaturedProjects() {
  const db = await getDB()
  return db.collection('projects').find({ featured: true, published: true }).toArray()
}

export async function getProjectsByCategory(category: string) {
  const db = await getDB()
  return db.collection('projects').find({ category, published: true }).toArray()
}

export async function updateProject(id: string | ObjectId, updates: Partial<Project>) {
  const db = await getDB()

  const { _id, createdAt, ...safeUpdates } = updates as any

  const result = await db.collection('projects').findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...safeUpdates,
        updatedAt: new Date(),
      }
    },
    { returnDocument: 'after' }
  )

  return result
}

export async function deleteProject(id: string | ObjectId) {
  const db = await getDB()

  const result = await db.collection('projects').deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount > 0
}

export async function togglePublished(id: string | ObjectId) {
  const db = await getDB()

  const project = await getProjectById(id)
  if (!project) return null

  return updateProject(id, { published: !project.published })
}

// ────────────────────────────────────────────────────────────
// Project ↔ Team linking
// ────────────────────────────────────────────────────────────

/**
 * Assign a team to a project. Both must exist; the assignment is idempotent
 * ($addToSet — re-assigning is a no-op, doesn't error).
 *
 * We DON'T verify the team is approved here — admins may want to preview
 * assignments before approval. Frontends can filter by approvalStatus.
 */
export async function assignTeamToProject(
  projectId: string,
  teamId: string,
): Promise<void> {
  if (!ObjectId.isValid(projectId)) throw new NotFoundError('Project not found')
  if (!ObjectId.isValid(teamId)) throw new NotFoundError('Team not found')

  const db = await getDB()

  // Verify both exist before mutating — cheaper than debugging orphaned refs.
  const [project, team] = await Promise.all([
    db.collection('projects').findOne({ _id: new ObjectId(projectId) }, { projection: { _id: 1 } }),
    db.collection('teams').findOne({ _id: new ObjectId(teamId) }, { projection: { _id: 1 } }),
  ])
  if (!project) throw new NotFoundError('Project not found')
  if (!team) throw new NotFoundError('Team not found')

  const result = await db.collection('projects').updateOne(
    { _id: new ObjectId(projectId) },
    {
      $addToSet: { teamIds: new ObjectId(teamId) } as any,
      $set: { updatedAt: new Date() },
    },
  )
  if (result.matchedCount === 0) throw new NotFoundError('Project not found')
}

/** Unassign a team from a project. Idempotent — no-op if team wasn't linked. */
export async function unassignTeamFromProject(
  projectId: string,
  teamId: string,
): Promise<void> {
  if (!ObjectId.isValid(projectId)) throw new NotFoundError('Project not found')
  if (!ObjectId.isValid(teamId)) throw new NotFoundError('Team not found')

  const db = await getDB()
  const result = await db.collection('projects').updateOne(
    { _id: new ObjectId(projectId) },
    {
      $pull: { teamIds: new ObjectId(teamId) } as any,
      $set: { updatedAt: new Date() },
    },
  )
  if (result.matchedCount === 0) throw new NotFoundError('Project not found')
}

/**
 * Return the teams assigned to a project with member + competition detail
 * populated. Single aggregation — one round-trip.
 */
export async function getProjectTeams(projectId: string) {
  const db = await getDB()
  if (!ObjectId.isValid(projectId)) throw new NotFoundError('Project not found')

  return db
    .collection('projects')
    .aggregate([
      { $match: { _id: new ObjectId(projectId) } },
      { $project: { teamIds: { $ifNull: ['$teamIds', []] } } },
      { $unwind: { path: '$teamIds', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'teams',
          localField: 'teamIds',
          foreignField: '_id',
          as: 'team',
        },
      },
      { $unwind: '$team' },
      { $replaceRoot: { newRoot: '$team' } },
      {
        $lookup: {
          from: 'users',
          localField: 'members',
          foreignField: '_id',
          as: 'memberDetails',
        },
      },
      {
        $project: {
          name: 1,
          teamCode: 1,
          approvalStatus: 1,
          isFinalized: 1,
          leaderId: 1,
          competitionId: 1,
          members: {
            $map: {
              input: '$memberDetails',
              as: 'm',
              in: { _id: '$$m._id', name: '$$m.name', email: '$$m.email' },
            },
          },
        },
      },
    ])
    .toArray()
}
