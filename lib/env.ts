

 
 // Every env var the app depends on is validated here at boot time.
 //If a required var is missing or malformed, the process fails LOUDLY on startup
 // instead of failing silently at request time or (worse) using an insecure fallback
 // Usage: `import { env } from '@/lib/env'` then `env.JWT_SECRET`, etc.
 
import { z } from 'zod'

const EnvSchema = z.object({
  // Database
  MONGO_URL: z.string().min(1, 'MONGO_URL is required'),
  // Optional DB name override (defaults to 'robotics-club'). Used by tests.
  MONGO_DB_NAME: z.string().min(1).optional(),


  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters. Generate one with: openssl rand -hex 32'),


  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters'),


  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1, 'Cloudinary cloud name is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  CLOUDINARY_UPLOAD_PRESET: z.string().min(1, 'CLOUDINARY_UPLOAD_PRESET is required'),


  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),



  // Public origin of the site. Google's redirect URI is built from it, so it must
  // match what is registered in Google Cloud Console exactly.
  APP_URL: z.string().url().optional(),

  // Google sign-in is offered only when BOTH are set.
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

  // Only addresses at this domain may sign in (OTP and Google). Empty = allow any.
  ALLOWED_EMAIL_DOMAIN: z.string().trim().toLowerCase().default('mnnit.ac.in'),

  SENTRY_DSN: z.string().url().optional(),



  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

function loadEnv() {
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {

    const flat = parsed.error.flatten().fieldErrors
    const messages = Object.entries(flat).map(
      ([key, errs]) => `  - ${key}: ${(errs || []).join(', ')}`,
    )
    throw new Error(
      `\n[env] Invalid or missing environment variables:\n${messages.join(
        '\n',
      )}\nCheck .env.local against .env.example.\n`,
    )
  }
  const data = parsed.data
  // Local dev: default to localhost so Google's redirect URI doesn't point at production.
  const appUrl =
    data.APP_URL ??
    (data.NODE_ENV === 'production' ? 'https://robotics-website-smoky.vercel.app' : 'http://localhost:3000')
  return { ...data, APP_URL: appUrl }
}

export const env = loadEnv()
export type Env = typeof env
