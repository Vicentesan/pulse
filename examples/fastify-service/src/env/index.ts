import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'prod', 'test']).default('dev'),
  PORT: z.number().default(3333),
  BASE_URL: z.string(),
  JWT_SECRET: z.string(),
  CLIENT_URL: z.string(),
})

export const env = envSchema.parse(process.env)
