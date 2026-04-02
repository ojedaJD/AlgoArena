'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/use-auth';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (enabled && isAuthenticated) {
      try {
        const s = getSocket();
        s.connect();
        setSocket(s);
        return () => {
          disconnectSocket();
          setSocket(null);
        };
      } catch {
        // Socket connection may fail in dev without WS server
      }
    }
  }, [enabled, isAuthenticated]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
