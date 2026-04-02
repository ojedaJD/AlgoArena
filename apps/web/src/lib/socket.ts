import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@dsa/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(token?: string): TypedSocket {
  if (socket) return socket;
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
  socket = io(WS_URL, {
    auth: token ? { token } : undefined,
    autoConnect: false,
    transports: ['websocket'],
  }) as TypedSocket;
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
