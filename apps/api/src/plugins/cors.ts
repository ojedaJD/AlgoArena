import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { config } from '../config/env.js';

async function corsPlugin(fastify: FastifyInstance) {
  const allowedOrigins =
    config.NODE_ENV === 'production'
      ? [/\.algoarena\.com$/]
      : ['http://localhost:3000', 'http://localhost:5173'];

  await fastify.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });
}

export default fp(corsPlugin, {
  name: 'cors',
});
