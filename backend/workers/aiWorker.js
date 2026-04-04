const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5002';

/**
 * Maps AI service verdict string to Prisma ContentStatus enum value.
 */
function verdictToStatus(verdict) {
  switch (verdict) {
    case 'AUTO_APPROVED': return 'APPROVED';
    case 'AUTO_REJECTED': return 'REJECTED';
    case 'NEEDS_REVIEW':  return 'FLAGGED';
    default:              return 'FLAGGED';
  }
}

const aiWorker = new Worker(
  'ai-analysis',
  async (job) => {
    const { contentId, type, body, filename, mimeType, sizeBytes } = job.data;

    console.log(`[aiWorker] Processing job ${job.id} for content #${contentId} (type: ${type})`);

    let aiResult;

    if (type === 'TEXT') {
      const { data } = await axios.post(`${AI_SERVICE_URL}/analyze/text`, { text: body });
      aiResult = data;
    } else if (type === 'IMAGE') {
      const { data } = await axios.post(`${AI_SERVICE_URL}/analyze/image`, {
        filename,
        mimeType,
        sizeBytes,
      });
      aiResult = data;
    } else {
      throw new Error(`Unknown content type: ${type}`);
    }

    const newStatus = verdictToStatus(aiResult.verdict);

    // Update content status and create analysis result record in a transaction
    await prisma.$transaction([
      prisma.content.update({
        where: { id: contentId },
        data: { status: newStatus },
      }),
      prisma.aiAnalysisResult.create({
        data: {
          contentId: contentId,
          verdict: aiResult.verdict,
          toxicityScore: aiResult.toxicityScore,
          confidence: aiResult.confidence,
          detectedCategories: aiResult.detectedCategories,
          categoryScores: aiResult.categoryScores,
          model: aiResult.model,
          analyzedAt: new Date(aiResult.analyzedAt),
        },
      }),
    ]);

    console.log(
      `[aiWorker] Content #${contentId} → verdict: ${aiResult.verdict} → status: ${newStatus} ` +
        `(toxicity: ${aiResult.toxicityScore}, confidence: ${aiResult.confidence})`
    );


    return {
      contentId,
      verdict: aiResult.verdict,
      status: newStatus,
      toxicityScore: aiResult.toxicityScore,
      confidence: aiResult.confidence,
      detectedCategories: aiResult.detectedCategories,
    };
  },
  { connection }
);

aiWorker.on('completed', (job, result) => {
  console.log(`[aiWorker] ✅ Job ${job.id} completed — content #${result.contentId} is now ${result.status}`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`[aiWorker] ❌ Job ${job?.id} failed: ${err.message}`);
});

aiWorker.on('error', (err) => {
  console.error('[aiWorker] Worker error:', err.message);
});

module.exports = aiWorker;
