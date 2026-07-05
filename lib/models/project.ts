import { ObjectId } from 'mongodb'
import { getDB } from '@/lib/db'

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
  image: string
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

  return result.value || result
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
