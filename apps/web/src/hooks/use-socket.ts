'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@dsa/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

let globalSocket: TypedSocket | null = null;

function getSocket(): TypedSocket {
  if (!globalSocket || globalSocket.disconnected) {
    globalSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    }) as TypedSocket;
  }
  return globalSocket;
}

type EventMap = ServerToClientEvents;
type EventName = keyof EventMap;
type EventCallback<K extends EventName> = EventMap[K];

/**
 * Hook to subscribe to a single Socket.io server event.
 *
 * @param event - The event name from ServerToClientEvents
 * @param handler - The callback invoked when the event fires
 *
 * @example
 * useSocket('match:state', (state) => setMatchState(state));
 */
export function useSocket<K extends EventName>(
  event: K,
  handler: EventCallback<K>
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();

    const stableHandler = (...args: Parameters<EventCallback<K>>) => {
      (handlerRef.current as (...a: typeof args) => void)(...args);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on(event as any, stableHandler as any);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off(event as any, stableHandler as any);
    };
  }, [event]);
}

/**
 * Hook to emit events to the server.
 * Returns a stable emit function.
 */
export function useSocketEmit() {
  const emit = useCallback(
    <K extends keyof ClientToServerEvents>(
      event: K,
      ...args: Parameters<ClientToServerEvents[K]>
    ) => {
      const socket = getSocket();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.emit(event as any, ...args);
    },
    []
  );

  return emit;
}

/**
 * Hook to get the raw socket instance (e.g. to check connection status).
 */
export function useSocketInstance(): TypedSocket {
  return getSocket();
}
