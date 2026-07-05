// In-memory storage for uploaded media (will be replaced with MongoDB)
// Structure ready for database integration
let uploadedMedia: Array<{
  _id: string
  filename: string
  url: string
  cloudinaryId: string
  uploadedAt: Date
  size: number
}> = []

export function getAllMedia() {
  return uploadedMedia
}

export function addMedia(media: { filename: string; url: string; cloudinaryId: string; size: number }) {
  const newMedia = {
    _id: Math.random().toString(36).substr(2, 9),
    ...media,
    uploadedAt: new Date(),
  }
  uploadedMedia.push(newMedia)
  return newMedia
}

export function deleteMedia(id: string) {
  uploadedMedia = uploadedMedia.filter((m) => m._id !== id)
}

export function getMediaUrl(id: string) {
  return uploadedMedia.find((m) => m._id === id)?.url
}
