import Redis from 'ioredis';
import { config } from '../config/index.js';

export let redisSubscriber: Redis | null = null;
export let redisPublisher: Redis | null = null;

export function initRedisClients(): { subscriber: Redis; publisher: Redis } {
  const options = {
    host: config.redis.host,
    port: config.redis.port,
    retryStrategy: (times: number) => {
      // Linear backoff capped at 3 seconds
      return Math.min(times * 300, 3000);
    },
    maxRetriesPerRequest: null,
  };

  redisSubscriber = new Redis(options);
  redisPublisher = new Redis(options);

  redisSubscriber.on('connect', () => {
    console.log(`🔌 Redis Subscriber connected to ${config.redis.host}:${config.redis.port}`);
  });

  redisSubscriber.on('error', (err) => {
    console.warn(`⚠️ Redis Subscriber error: ${err.message}`);
  });

  redisPublisher.on('connect', () => {
    console.log(`🔌 Redis Publisher connected to ${config.redis.host}:${config.redis.port}`);
  });

  redisPublisher.on('error', (err) => {
    console.warn(`⚠️ Redis Publisher error: ${err.message}`);
  });

  return { subscriber: redisSubscriber, publisher: redisPublisher };
}
