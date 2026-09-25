import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env at root or apps/api
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_PORT || '4000', 10),
  corsOrigin: process.env.API_CORS_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://tactiq_user:tactiq_secure_password@localhost:5432/tactiq_db?schema=public',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    channel: process.env.REDIS_CHANNEL || 'tactiq_tracking_stream',
  },
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
};
