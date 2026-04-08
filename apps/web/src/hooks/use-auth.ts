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

  const useUser: () => { user: unknown; isLoading: boolean } = (() => {
    if (!isAuth0Enabled) {
      return () => ({ user: DEV_USER, isLoading: false });
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@auth0/nextjs-auth0/client');
      return mod.useUser as () => { user: unknown; isLoading: boolean };
    } catch {
      return () => ({ user: DEV_USER, isLoading: false });
    }
  })();

  const { user: rawUser, isLoading } = useUser();
  const user = (rawUser as AuthUser | null | undefined) ?? null;

  const isAuthenticated = Boolean(user && !isLoading);

  const displayName =
    user?.['https://algoarena.io/displayName'] ??
    user?.name ??
    user?.nickname ??
    (user?.email ? user.email.split('@')[0] : 'User');

  const avatarUrl = user?.picture;

  const roles = user?.['https://algoarena.io/roles'] ?? [];
  const isAdmin = roles.includes('admin') || user?.sub === DEV_USER.sub;

  const login = useCallback((returnTo?: string) => {
    if (!isAuth0Enabled) {
      if (returnTo) window.location.href = returnTo;
      return;
    }
    const params = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    window.location.href = `/api/auth/login${params}`;
  }, [isAuth0Enabled]);

  const logout = useCallback(() => {
    if (!isAuth0Enabled) {
      window.location.href = '/';
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { disconnectSocket } = require('@/lib/socket');
      disconnectSocket();
    } catch { /* ignore */ }
    window.location.href = '/api/auth/logout';
  }, [isAuth0Enabled]);

  return {
    user,
    isLoading,
    isAuthenticated,
    displayName,
    avatarUrl,
    isAdmin,
    login,
    logout,
  };
}
