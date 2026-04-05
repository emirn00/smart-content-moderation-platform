require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

const path = require('path');
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const moderationRoutes = require('./routes/moderationRoutes');
const { apiLimiter, authLimiter } = require('./middlewares/rateLimitMiddleware');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contents', apiLimiter, contentRoutes);
app.use('/api/moderation', apiLimiter, moderationRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'OK',
      message: 'Backend is healthy',
      database: 'Connected via Prisma',
      queue: 'BullMQ worker active',
      aiService: process.env.AI_SERVICE_URL || 'http://localhost:5002',
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Smart Content Moderation API', version: '1.0.0' });
});

// ─── Start AI Worker ──────────────────────────────────────────────────────────
// Importing the worker module starts listening to the queue immediately
require('./workers/aiWorker');

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`🤖 AI Service URL: ${process.env.AI_SERVICE_URL || 'http://localhost:5002'}`);
});
