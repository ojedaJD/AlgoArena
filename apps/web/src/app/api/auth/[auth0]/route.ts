import { handleAuth } from '@auth0/nextjs-auth0';

/**
 * Auth0 catch-all route handler.
 *
 * Handles the following routes automatically:
 *   GET /api/auth/login    — redirects to Auth0 Universal Login
 *   GET /api/auth/callback — processes the authorization code
 *   GET /api/auth/logout   — clears session and redirects
 *   GET /api/auth/me       — returns the current user profile
 */
export const GET = handleAuth();
