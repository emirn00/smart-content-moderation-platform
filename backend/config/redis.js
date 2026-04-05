const IORedis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT) || 6379;

/**
 * Standard Redis Client for general-purpose execution (Caching, Rate Limiting)
 */
const redisClient = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null, // Critical setting for BullMQ and robust background tasks
});

/**
 * Dedicated Redis Connection for Publishing Pub/Sub messages
 */
const redisPublisher = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

/**
 * Dedicated Redis Connection for Subscribing to Pub/Sub messages.
 * Note: A Redis connection in "subscriber" mode cannot issue standard commands.
 */
const redisSubscriber = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

redisClient.on('connect', () => console.log('🟢 General Redis Client Connected'));
redisPublisher.on('connect', () => console.log('🟢 Redis Publisher Connected'));
redisSubscriber.on('connect', () => console.log('🟢 Redis Subscriber Connected'));

redisClient.on('error', (err) => console.error('🔴 Redis Client Error', err.message));

module.exports = {
  redisClient,
  redisPublisher,
  redisSubscriber
};
