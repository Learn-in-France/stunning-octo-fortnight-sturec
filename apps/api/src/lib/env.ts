import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  FIREBASE_PROJECT_ID: z.string().default(''),
  FIREBASE_CLIENT_EMAIL: z.string().default(''),
  FIREBASE_PRIVATE_KEY: z.string().default(''),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  API_PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

let env: Env

export function getEnv(): Env {
  if (!env) {
    const result = envSchema.safeParse(process.env)
    if (!result.success) {
      const formatted = result.error.flatten()
      console.error('Invalid environment variables:', formatted.fieldErrors)
      throw new Error('Invalid environment variables')
    }
    env = result.data
  }
  return env
}
