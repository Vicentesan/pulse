import { drizzle } from 'drizzle-orm/node-postgres'

import { env } from '../env'
import * as schema from './schemas'

export const db = drizzle(env.db.DATABASE_URL, {
  schema,
  logger: env.app.NODE_ENV !== 'prod',
})
