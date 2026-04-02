'use client';

import { useCallback } from 'react';

export interface AuthUser {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  nickname?: string;
  'https://algoarena.io/displayName'?: string;
  'https://algoarena.io/rating'?: number;
  'https://algoarena.io/xp'?: number;
  'https://algoarena.io/roles'?: string[];
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  displayName: string;
  avatarUrl: string | undefined;
  isAdmin: boolean;
  login: (returnTo?: string) => void;
  logout: () => void;
}

// Dev mode mock user when Auth0 is not configured
const DEV_USER: AuthUser = {
  sub: 'dev|local',
  name: 'Dev User',
  email: 'dev@algoarena.local',
  nickname: 'devuser',
};

export function useAuth(): UseAuthReturn {
  const isAuth0Enabled = Boolean(process.env.NEXT_PUBLIC_AUTH0_ENABLED);

  // When Auth0 is configured, use the real provider
  if (isAuth0Enabled) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useUser } = require('@auth0/nextjs-auth0/client');
      return useAuth0Real(useUser);
    } catch {
      // Fall through to dev mode
    }
  }

  // Dev mode — return a mock user so all pages are accessible
  const login = useCallback((returnTo?: string) => {
    if (returnTo) window.location.href = returnTo;
  }, []);

  const logout = useCallback(() => {
    window.location.href = '/';
  }, []);

  return {
    user: DEV_USER,
    isLoading: false,
    isAuthenticated: true,
    displayName: DEV_USER.name!,
    avatarUrl: undefined,
    isAdmin: true,
    login,
    logout,
  };
}

function useAuth0Real(useUser: () => { user: unknown; isLoading: boolean }): UseAuthReturn {
  const { user: rawUser, isLoading } = useUser();
  const user = rawUser as AuthUser | null | undefined;

  const isAuthenticated = Boolean(user && !isLoading);

  const displayName =
    user?.['https://algoarena.io/displayName'] ??
    user?.name ??
    user?.nickname ??
    (user?.email ? user.email.split('@')[0] : 'User');

  const avatarUrl = user?.picture;

  const roles = user?.['https://algoarena.io/roles'] ?? [];
  const isAdmin = roles.includes('admin');

  const login = useCallback((returnTo?: string) => {
    const params = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    window.location.href = `/api/auth/login${params}`;
  }, []);

  const logout = useCallback(() => {
    try {
      const { disconnectSocket } = require('@/lib/socket');
      disconnectSocket();
    } catch { /* ignore */ }
    window.location.href = '/api/auth/logout';
  }, []);

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated,
    displayName,
    avatarUrl,
    isAdmin,
    login,
    logout,
  };
}
