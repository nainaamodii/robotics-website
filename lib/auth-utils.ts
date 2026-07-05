// lib/auth-utils.ts
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function getAuthUserId(): Promise<string | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) return null

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as { userId: string }
        return decoded.userId
    } catch (error) {
        return null
    }
}