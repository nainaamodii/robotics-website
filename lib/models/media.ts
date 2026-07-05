import { ObjectId } from 'mongodb'
import { getDB } from '@/lib/db'

export interface Media {
  _id?: ObjectId
  filename: string
  cloudinaryUrl: string
  cloudinaryPublicId: string
  uploadedBy: ObjectId
  fileSize: number
  mimeType: string
  createdAt: Date
  updatedAt: Date
}

export async function createMedia(mediaData: Omit<Media, '_id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDB()

  const newMedia: Media = {
    ...mediaData,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection('media').insertOne(newMedia)
  return { ...newMedia, _id: result.insertedId }
}

export async function getMediaById(id: string | ObjectId) {
  const db = await getDB()
  return db.collection('media').findOne({ _id: new ObjectId(id) })
}

export async function getAllMedia() {
  const db = await getDB()
  return db.collection('media').find({}).sort({ createdAt: -1 }).toArray()
}

export async function getMediaByUploadedBy(userId: string | ObjectId) {
  const db = await getDB()
  return db.collection('media').find({ uploadedBy: new ObjectId(userId) }).sort({ createdAt: -1 }).toArray()
}


export async function deleteMedia(id: string) {
  const db = await getDB()
  // Force conversion to ObjectId
  const result = await db.collection("media").deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount > 0
}

export async function deleteMediaByPublicId(publicId: string) {
  const db = await getDB()

  const result = await db.collection('media').deleteOne({ cloudinaryPublicId: publicId })
  return result.deletedCount > 0
}
