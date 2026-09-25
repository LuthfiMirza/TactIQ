import http from 'http';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './services/prisma.service.js';
import { initRedisClients } from './services/redis.service.js';
import { setupSocketServer } from './websocket/socket.server.js';

async function bootstrap() {
  console.log('🚀 Booting TactIQ API Gateway & Socket Server...');

  // Initialize Express App
  const app = createApp();

  // Create HTTP Server
  const httpServer = http.createServer(app);

  // Initialize Redis Clients (Pub/Sub)
  initRedisClients();

  // Initialize Socket.io Server connected to HTTP Server & Redis
  setupSocketServer(httpServer);

  // Connect to PostgreSQL database via Prisma
  await connectDatabase();

  // Start listening
  httpServer.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`⚽ TactIQ Central API Gateway running on port : ${config.port}`);
    console.log(`🌐 REST API Base URL: http://localhost:${config.port}/api/v1`);
    console.log(`⚡ WebSocket Server : ws://localhost:${config.port}`);
    console.log(`🤖 ML Service Target: ${config.mlServiceUrl}`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('🛑 Shutting down TactIQ API Gateway gracefully...');
    httpServer.close(() => {
      console.log('✅ HTTP and WebSocket server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error during API bootstrap:', error);
  process.exit(1);
});
