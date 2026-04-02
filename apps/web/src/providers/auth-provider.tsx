'use client';
import { ReactNode } from 'react';

/**
 * Auth provider — wraps Auth0 UserProvider when configured,
 * otherwise renders children directly for local development.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // In dev without Auth0 configured, skip the provider
  if (!process.env.NEXT_PUBLIC_AUTH0_ENABLED) {
    return <>{children}</>;
  }

  // Dynamic import would be needed for conditional provider,
  // but since UserProvider is safe to render without config on client,
  // we use it directly when the flag is set.
  const { UserProvider } = require('@auth0/nextjs-auth0/client');
  return <UserProvider>{children}</UserProvider>;
}
