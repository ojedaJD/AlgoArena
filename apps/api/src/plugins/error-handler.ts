import type { FastifyInstance, FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { ZodError } from 'zod';

async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError | Error, request, reply) => {
    // Known application errors
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message,
        statusCode: error.statusCode,
      });
    }

    // Zod validation errors
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: 'Request validation failed',
        statusCode: 400,
        details: error.flatten(),
      });
    }

    // Fastify built-in validation errors (JSON schema)
    if ('validation' in error && error.validation) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: error.message,
        statusCode: 400,
      });
    }

    // Unexpected errors
    logger.error(
      {
        err: error,
        requestId: request.id,
        url: request.url,
        method: request.method,
      },
      'Unhandled error',
    );

    return reply.status(500).send({
      error: 'InternalServerError',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message,
      statusCode: 500,
    });
  });
}

export default fp(errorHandlerPlugin, {
  name: 'error-handler',
});
