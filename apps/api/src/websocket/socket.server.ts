import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  TrackingFramePayload,
} from '@tactiq/shared-types';
import { redisSubscriber } from '../services/redis.service.js';
import { config } from '../config/index.js';

export let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

export function setupSocketServer(httpServer: HttpServer): Server<ClientToServerEvents, ServerToClientEvents> {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*', // Allow frontend development ports
      methods: ['GET', 'POST'],
      credentials: false,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`⚡ WebSocket client connected: ${socket.id}`);

    // Join room for a specific tracking session
    socket.on('join_session', ({ sessionId }) => {
      const room = `session_${sessionId}`;
      socket.join(room);
      console.log(`👥 Client ${socket.id} joined tracking room: ${room}`);

      socket.emit('session_status', {
        sessionId,
        status: 'READY',
      });
    });

    // Leave room
    socket.on('leave_session', ({ sessionId }) => {
      const room = `session_${sessionId}`;
      socket.leave(room);
      console.log(`👋 Client ${socket.id} left tracking room: ${room}`);
    });

    // Latency benchmark ping
    socket.on('ping_stream', () => {
      socket.emit('pong_stream', { timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  // Subscribe to Redis tracking stream channel
  if (redisSubscriber) {
    redisSubscriber.subscribe(config.redis.channel, (err, count) => {
      if (err) {
        console.warn(`⚠️ Failed to subscribe to Redis channel ${config.redis.channel}:`, err.message);
      } else {
        console.log(`📡 Redis Subscribed to '${config.redis.channel}' (Active channels: ${count})`);
      }
    });

    redisSubscriber.on('message', (channel: string, message: string) => {
      if (channel === config.redis.channel && io) {
        try {
          const payload: TrackingFramePayload = JSON.parse(message);
          const targetRoom = `session_${payload.sessionId}`;

          // Broadcast frame_update strictly to the session's subscribers
          io.to(targetRoom).emit('frame_update', payload);
        } catch (parseErr) {
          console.error('❌ Failed to parse Redis tracking payload:', parseErr);
        }
      }
    });
  }

  return io;
}
