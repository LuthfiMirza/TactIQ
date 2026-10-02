import Redis from 'ioredis';
import { config } from '../config/index.js';

export let redisSubscriber: Redis | null = null;
export let redisPublisher: Redis | null = null;

let hasLoggedSubscriberWarn = false;
let hasLoggedPublisherWarn = false;

export function initRedisClients(): { subscriber: Redis; publisher: Redis } {
  const options = {
    host: config.redis.host,
    port: config.redis.port,
    retryStrategy: (times: number) => {
      return Math.min(times * 1000, 5000);
    },
    maxRetriesPerRequest: null,
  };

  redisSubscriber = new Redis(options);
  redisPublisher = new Redis(options);

  redisSubscriber.on('connect', () => {
    hasLoggedSubscriberWarn = false;
    console.log(`🔌 Redis Subscriber connected to ${config.redis.host}:${config.redis.port}`);
  });

  redisSubscriber.on('error', (err: any) => {
    if (!hasLoggedSubscriberWarn) {
      const detail = err.message || err.code || 'ECONNREFUSED';
      console.warn(`⚠️ Redis Subscriber unavailable at ${config.redis.host}:${config.redis.port} (${detail}). Real-time stream will fallback.`);
      hasLoggedSubscriberWarn = true;
    }
  });

  redisPublisher.on('connect', () => {
    hasLoggedPublisherWarn = false;
    console.log(`🔌 Redis Publisher connected to ${config.redis.host}:${config.redis.port}`);
  });

  redisPublisher.on('error', (err: any) => {
    if (!hasLoggedPublisherWarn) {
      const detail = err.message || err.code || 'ECONNREFUSED';
      console.warn(`⚠️ Redis Publisher unavailable at ${config.redis.host}:${config.redis.port} (${detail}). In-memory cache fallback will be used.`);
      hasLoggedPublisherWarn = true;
    }
  });

  return { subscriber: redisSubscriber, publisher: redisPublisher };
}
