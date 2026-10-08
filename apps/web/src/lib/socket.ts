import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@tactiq/shared-types';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getWsUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
};

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    const wsUrl = getWsUrl();
    socket = io(wsUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to TactIQ WebSocket Hub at', wsUrl, 'ID:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ WebSocket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket Hub:', reason);
    });
  }

  return socket;
}

export function joinTrackingSession(sessionId: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('join_session', { sessionId });
  } else {
    s.once('connect', () => {
      s.emit('join_session', { sessionId });
    });
  }
}

export function leaveTrackingSession(sessionId: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('leave_session', { sessionId });
  }
}
