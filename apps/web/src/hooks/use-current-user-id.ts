'use client';

import { useState, useEffect } from 'react';
import { usersApi } from '@/lib/api-client';

export function useCurrentUserId(): string {
  const [userId, setUserId] = useState('');
  useEffect(() => {
    usersApi.getMe().then((u: any) => setUserId(u.id)).catch(() => {});
  }, []);
  return userId;
}
