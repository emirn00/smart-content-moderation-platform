const express = require('express');
const cors = require('cors');
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;


// Redis Configuration
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;
const connection = new IORedis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
});

// BullMQ Setup
const myQueue = new Queue('my-queue', { connection });

// Worker Setup (Example)
const worker = new Worker('my-queue', async job => {
  console.log(`Processing job ${job.id} with data:`, job.data);
  // Simulate heavy work
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { result: 'Job completed successfully' };
}, { connection });

worker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed with ${err.message}`);
});

// Middleware
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('API is running with BullMQ and Redis...');
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'OK', 
      message: 'Backend is healthy',
      database: 'Connected via Prisma',
      queue: 'BullMQ Queue Ready'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});



// BullMQ Test Endpoint
app.post('/api/jobs', async (req, res) => {
  const { data } = req.body;
  try {
    const job = await myQueue.add('test-job', { data });
    res.json({ jobId: job.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
