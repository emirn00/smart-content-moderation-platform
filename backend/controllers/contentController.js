const { PrismaClient } = require('@prisma/client');
const aiQueue = require('../queues/aiQueue');

const prisma = new PrismaClient();

/**
 * POST /api/contents
 * Submit new content (text or image) for AI moderation.
 * Requires: verifyToken middleware
 */
const submitContent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, body } = req.body;

    // Validate type
    if (!type || !['TEXT', 'IMAGE'].includes(type.toUpperCase())) {
      return res.status(400).json({ message: 'type must be "TEXT" or "IMAGE"' });
    }

    const contentType = type.toUpperCase();

    // Type-specific validation
    if (contentType === 'TEXT') {
      if (!body || !body.trim()) {
        return res.status(400).json({ message: 'body is required for text content' });
      }
      if (body.length > 5000) {
        return res.status(400).json({ message: 'body must not exceed 5000 characters' });
      }
    }

    let filename = null;
    let mimeType = null;
    let sizeBytes = null;

    if (contentType === 'IMAGE') {
      if (!req.file) {
        return res.status(400).json({ message: 'Image file is required for image content' });
      }
      filename = req.file.filename;
      mimeType = req.file.mimetype;
      sizeBytes = req.file.size;
    }

    // Create the content record with PENDING status
    const content = await prisma.content.create({
      data: {
        userId,
        type: contentType,
        body: contentType === 'TEXT' ? body.trim() : null,
        filename: contentType === 'IMAGE' ? filename : null,
        mimeType: contentType === 'IMAGE' ? mimeType : null,
        sizeBytes: contentType === 'IMAGE' ? sizeBytes : null,
        status: 'PENDING',
      },
    });

    // Enqueue the AI analysis job
    const job = await aiQueue.add('analyze', {
      contentId: content.id,
      type: contentType,
      body: content.body,
      filename: content.filename,
      mimeType: content.mimeType,
      sizeBytes: content.sizeBytes,
    });

    console.log(`[contentController] Enqueued AI job ${job.id} for content #${content.id}`);

    return res.status(202).json({
      message: 'Content submitted successfully. AI analysis queued.',
      contentId: content.id,
      status: content.status,
      jobId: job.id,
    });
  } catch (error) {
    console.error('[contentController] submitContent error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * GET /api/contents/me
 * Get all contents submitted by the currently authenticated user.
 * Requires: verifyToken middleware
 */
const getMyContents = async (req, res) => {
  try {
    const userId = req.user.id;

    const contents = await prisma.content.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        body: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ contents });
  } catch (error) {
    console.error('[contentController] getMyContents error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * GET /api/contents/:id
 * Get a specific content by ID (owner or moderator only).
 * Requires: verifyToken middleware
 */
const getContentById = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const contentId = parseInt(req.params.id);

    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { user: { select: { id: true, email: true, role: true } } },
    });

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Only the owner or a moderator can view this
    if (content.userId !== userId && userRole !== 'MODERATOR') {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json({ content });
  } catch (error) {
    console.error('[contentController] getContentById error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  submitContent,
  getMyContents,
  getContentById,
};
