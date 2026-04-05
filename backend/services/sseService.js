const { redisSubscriber } = require('../config/redis');

// List of connected moderator clients
let clients = [];

// Subscribe to the global Redis moderation events channel
redisSubscriber.subscribe('moderation:events', (err) => {
  if (err) console.error('🔴 Failed to subscribe to moderation:events channel', err);
});

// When a message is published from any node instance (or worker), push to our local pool
redisSubscriber.on('message', (channel, message) => {
  if (channel === 'moderation:events') {
    const payload = `data: ${message}\n\n`;
    clients.forEach((client) => {
      client.write(payload);
    });
  }
});

/**
 * Express handler to start a new SSE stream.
 */
const sseStreamHandler = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Add the response object to the connected clients pool
  clients.push(res);

  // Send an initial handshake payload
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

  // If the client drops the connection, remove them from the pool
  req.on('close', () => {
    clients = clients.filter((client) => client !== res);
  });
};

module.exports = {
  sseStreamHandler,
};
