import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  AUTH0_DOMAIN: z.string().default('your-tenant.us.auth0.com'),
  AUTH0_AUDIENCE: z.string().default('https://api.algoarena.com'),
  JUDGE_DOCKER_SOCKET: z.string().default('/var/run/docker.sock'),
  JUDGE_MAX_CPU: z.coerce.number().default(1),
  JUDGE_MAX_MEMORY_MB: z.coerce.number().default(256),
  JUDGE_TIMEOUT_MS: z.coerce.number().default(10000),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
