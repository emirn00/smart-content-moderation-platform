require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// ─── Helper Utilities ────────────────────────────────────────────────────────

/**
 * Returns a float between min and max (inclusive), rounded to 4 decimals.
 */
function rand(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(4));
}

/**
 * Pick N unique items from an array randomly.
 */
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ─── Content Category Definitions ────────────────────────────────────────────

const CATEGORIES = [
  'hate_speech',
  'harassment',
  'sexual_content',
  'violence',
  'spam',
  'misinformation',
  'self_harm',
  'safe',
];

const TOXIC_KEYWORDS = [
  'hate', 'kill', 'die', 'attack', 'abuse', 'violence', 'terror',
  'racist', 'sexist', 'disgusting', 'evil', 'harmful', 'threat',
  'explicit', 'nude', 'blood', 'weapon'
];

const SUSPICIOUS_KEYWORDS = [
  'maybe', 'unsure', 'consider', 'could be', 'might', 'risk',
  'controversial', 'offensive', 'borderline', 'sensitive'
];

// ─── Score Computation ────────────────────────────────────────────────────────

/**
 * Analyze plain text for toxicity.
 * Returns a detailed breakdown per category and an overall toxicity score.
 */
function analyzeText(text) {
  const lowerText = text.toLowerCase();

  // Check keyword signals
  const hasToxicSignal = TOXIC_KEYWORDS.some((kw) => lowerText.includes(kw));
  const hasSuspiciousSignal = SUSPICIOUS_KEYWORDS.some((kw) => lowerText.includes(kw));

  let toxicityScore;
  let detectedCategories;

  if (hasToxicSignal) {
    // Clearly toxic: 0.72 – 0.99
    toxicityScore = rand(0.72, 0.99);
    detectedCategories = pickRandom(
      CATEGORIES.filter((c) => c !== 'safe'),
      Math.floor(rand(1, 4))
    );
  } else if (hasSuspiciousSignal) {
    // Borderline / needs review: 0.38 – 0.71
    toxicityScore = rand(0.38, 0.71);
    detectedCategories = pickRandom(
      CATEGORIES.filter((c) => c !== 'safe'),
      1
    );
  } else {
    // Likely safe: 0.01 – 0.37
    toxicityScore = rand(0.01, 0.37);
    detectedCategories = ['safe'];
  }

  const confidence = rand(0.78, 0.99);

  const categoryScores = {};
  CATEGORIES.forEach((cat) => {
    if (detectedCategories.includes(cat)) {
      categoryScores[cat] = rand(0.5, toxicityScore + 0.05);
    } else {
      categoryScores[cat] = rand(0.01, 0.25);
    }
  });

  return {
    toxicityScore,
    confidence,
    detectedCategories,
    categoryScores,
  };
}

/**
 * Analyze an image (by filename / metadata heuristics — mock logic).
 * In a real service this would call a vision model.
 */
function analyzeImage(filename = '', mimeType = '') {
  const lowerName = filename.toLowerCase();
  
  // Custom keywords for images
  const IMG_TOXIC = ['blood', 'weapon', 'nude', 'gore', 'kill', 'gun', 'knife', 'dead'];
  const IMG_SUSPICIOUS = ['bikini', 'swimsuit', 'fight', 'protest', 'drunk', 'party'];
  
  const hasToxicSignal = IMG_TOXIC.some((kw) => lowerName.includes(kw));
  const hasSuspiciousSignal = IMG_SUSPICIOUS.some((kw) => lowerName.includes(kw));

  let toxicityScore;
  let detectedCategories;

  if (hasToxicSignal) {
    // Highly likely to be toxic based on filename
    toxicityScore = rand(0.75, 0.98);
    detectedCategories = pickRandom(['violence', 'sexual_content'], 1);
  } else if (hasSuspiciousSignal) {
    // Borderline based on filename
    toxicityScore = rand(0.40, 0.65);
    detectedCategories = ['sexual_content', 'safe'].sort(() => 0.5 - Math.random()).slice(0, 1);
  } else {
    // Randomly assign a risk level for neutral filenames — skewed heavily toward safe
    const dice = Math.random();
    if (dice < 0.05) {
      toxicityScore = rand(0.72, 0.95);
      detectedCategories = ['violence'];
    } else if (dice < 0.15) {
      toxicityScore = rand(0.38, 0.70);
      detectedCategories = ['sexual_content'];
    } else {
      toxicityScore = rand(0.01, 0.37);
      detectedCategories = ['safe'];
    }
  }

  const confidence = rand(0.70, 0.98);

  const categoryScores = {};
  CATEGORIES.forEach((cat) => {
    if (detectedCategories.includes(cat)) {
      categoryScores[cat] = rand(0.45, toxicityScore + 0.05);
    } else {
      categoryScores[cat] = rand(0.01, 0.2);
    }
  });

  return {
    toxicityScore,
    confidence,
    detectedCategories,
    categoryScores,
  };
}

/**
 * Compute the moderation verdict based on the toxicity score.
 * Thresholds:
 *   >= 0.72  → AUTO_REJECTED   (auto-flagged, no human needed)
 *   0.38–0.71 → NEEDS_REVIEW   (send to moderator queue)
 *   < 0.38   → AUTO_APPROVED   (safe, auto-approved)
 */
function computeVerdict(toxicityScore) {
  if (toxicityScore >= 0.72) return 'AUTO_REJECTED';
  if (toxicityScore >= 0.38) return 'NEEDS_REVIEW';
  return 'AUTO_APPROVED';
}

// ─── Simulate Processing Delay ────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /health
 * Health check for the AI service itself.
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'AI Mock Service', port: PORT });
});

/**
 * POST /analyze/text
 * Body: { text: string }
 * Returns toxicity analysis for a plain-text submission.
 */
app.post('/analyze/text', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text field is required and must be a non-empty string' });
  }

  if (text.length > 10000) {
    return res.status(400).json({ error: 'text exceeds maximum length of 10,000 characters' });
  }

  // Simulate AI processing time (300 – 900ms)
  await sleep(rand(300, 900));

  const analysis = analyzeText(text);
  const verdict = computeVerdict(analysis.toxicityScore);

  res.json({
    contentType: 'text',
    verdict,
    ...analysis,
    analyzedAt: new Date().toISOString(),
    model: 'mock-toxicity-v1',
  });
});

/**
 * POST /analyze/image
 * Body: { filename: string, mimeType: string, sizeBytes: number }
 * In a real service, this would accept a base64 or multipart file.
 * Here we mock the analysis based on metadata.
 */
app.post('/analyze/image', async (req, res) => {
  const { filename = '', mimeType = '', sizeBytes = 0 } = req.body;

  if (!filename && !mimeType) {
    return res.status(400).json({ error: 'filename or mimeType is required' });
  }

  // Simulate AI processing time (500 – 1500ms for image)
  await sleep(rand(500, 1500));

  const analysis = analyzeImage(filename, mimeType);
  const verdict = computeVerdict(analysis.toxicityScore);

  res.json({
    contentType: 'image',
    verdict,
    ...analysis,
    analyzedAt: new Date().toISOString(),
    model: 'mock-vision-v1',
  });
});

/**
 * POST /analyze
 * Generic endpoint — auto-detects text vs image by `contentType` field.
 * Body: { contentType: 'text' | 'image', text?: string, filename?: string, mimeType?: string }
 */
app.post('/analyze', async (req, res) => {
  const { contentType } = req.body;

  if (!contentType) {
    return res.status(400).json({ error: 'contentType field is required ("text" or "image")' });
  }

  if (contentType === 'text') {
    return res.redirect(307, '/analyze/text');
  }

  if (contentType === 'image') {
    return res.redirect(307, '/analyze/image');
  }

  return res.status(400).json({ error: 'contentType must be "text" or "image"' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🤖 AI Mock Service running on port ${PORT}`);
  console.log(`   Thresholds: AUTO_APPROVED < 0.38 | NEEDS_REVIEW 0.38–0.71 | AUTO_REJECTED >= 0.72`);
});
