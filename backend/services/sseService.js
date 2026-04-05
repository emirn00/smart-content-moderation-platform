const EventEmitter = require('events');

// Global event emitter for Server-Sent Events
const sseEmitter = new EventEmitter();

// List of connected moderator clients
let clients = [];

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

/**
 * Standardize and broadcast an event payload to all active clients.
 */
sseEmitter.on('jobCompleted', (resultData) => {
  const message = `data: ${JSON.stringify({ type: 'UPDATE', data: resultData })}\n\n`;
  clients.forEach((client) => {
    client.write(message);
  });
});

module.exports = {
  sseEmitter,
  sseStreamHandler,
};
