import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { config } from './env.js';
import { UnauthorizedError } from '../lib/errors.js';

const issuer = `https://${config.AUTH0_DOMAIN}/`;
const jwksUrl = new URL(`${issuer}.well-known/jwks.json`);

const JWKS = createRemoteJWKSet(jwksUrl);

export interface Auth0TokenPayload extends JWTPayload {
  sub: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Verify an Auth0 JWT token.
 * Validates signature against the JWKS, expiration, issuer, and audience.
 * Returns the decoded payload on success, throws UnauthorizedError on failure.
 */
export async function verifyToken(token: string): Promise<Auth0TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience: config.AUTH0_AUDIENCE,
    });

    if (!payload.sub) {
      throw new UnauthorizedError('Token missing subject claim');
    }

    return payload as Auth0TokenPayload;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw err;
    }
    throw new UnauthorizedError('Invalid or expired token');
  }
}
