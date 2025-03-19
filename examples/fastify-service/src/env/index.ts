import { z } from 'zod'

export const env = {
  db: loadDbEnvs(),
  app: loadAppEnvs(),
}

function loadAppEnvs() {
  const schema = z.object({
    NODE_ENV: z.enum(['dev', 'prod', 'test']).default('dev'),
    PORT: z.number().default(3000),
    BASE_URL: z.string(),
    JWT_SECRET: z.string(),
    CLIENT_URL: z.string(),
  })

  return schema.parse(process.env)
}

function loadDbEnvs() {
  const schema = z.object({
    DATABASE_URL: z.string(),
  })

  return schema.parse(process.env)
}
