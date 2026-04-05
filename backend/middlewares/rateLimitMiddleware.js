const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { redisClient } = require('../config/redis');

// Standard API Rate Limiter
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 5 * 60 * 1000, // 5 minutes block
  limit: 100, // Limit each IP to 100 requests per 5 minutes
  standardHeaders: true, 
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again in 5 minutes.',
    status: 429
  }
});

// Strict Rate Limiter for Authentication / Login attempts
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes block
  limit: 20, // Limit each IP to 20 requests per 15 mins for auth operations
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts, please try again later.',
    status: 429
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
