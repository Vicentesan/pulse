import fastifySwagger from '@fastify/swagger'
import fastify from 'fastify'
import type { FastifyInstance } from 'fastify/types/instance'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'

import { logger } from '@/adapters/logger'
import { env } from '@/env'

import { errorHandler } from './error-handler'
import { routes } from './routes'
import { transformSwaggerSchema } from './transform-schema'

const app: FastifyInstance = buildFastifyInstance()

export function startServer() {
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Plotwist',
        version: '0.1.0',
      },
      servers: [
        {
          url: env.BASE_URL,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    transform: (schema) => {
      try {
        return transformSwaggerSchema(schema)
      } catch (err) {
        return schema
      }
    },
  })

  app.setErrorHandler(errorHandler)

  routes(app)

  app
    .listen({
      port: env.PORT,
      host: '0.0.0.0',
    })
    .then(() => {
      logger.info(`HTTP server running at ${env.BASE_URL}`)
    })
}

export function buildFastifyInstance() {
  return fastify()
}
