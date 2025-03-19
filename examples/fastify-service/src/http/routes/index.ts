import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyMultipart from '@fastify/multipart'
import fastifySwaggerUi from '@fastify/swagger-ui'
import type { FastifyInstance } from 'fastify'

import { env } from '@/env'

export function routes(app: FastifyInstance) {
  if (env.NODE_ENV === 'dev') {
    app.register(fastifySwaggerUi, {
      routePrefix: '/docs',
    })
  }

  app.register(fastifyCors, {
    origin: getCorsOrigin(),
  })
  app.register(fastifyCookie)

  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  })

  app.register(fastifyMultipart)
}

function getCorsOrigin() {
  return env.NODE_ENV === 'prod' ? env.CLIENT_URL : '*'
}
