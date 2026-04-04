const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/moderation/queue
 * Returns all contents with status FLAGGED for manual review.
 * Only accessible by MODERATOR role.
 */
const getModerationQueue = async (req, res) => {
  try {
    const queue = await prisma.content.findMany({
      where: {
        status: 'FLAGGED',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        aiAnalysisResult: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      count: queue.length,
      queue
    });
  } catch (error) {
    console.error('[moderationController] getModerationQueue error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * POST /api/moderation/action
 * Approves or rejects a content item manually.
 * Body: { contentId, action, reason }
 * Only accessible by MODERATOR role.
 */
const takeModerationAction = async (req, res) => {
  try {
    const { contentId, action, reason } = req.body;
    const moderatorId = req.user.id;

    if (!contentId || !action) {
      return res.status(400).json({ message: 'contentId and action are required' });
    }

    const normalizedAction = action.toUpperCase();
    if (!['APPROVE', 'REJECT'].includes(normalizedAction)) {
      return res.status(400).json({ message: 'Action must be APPROVE or REJECT' });
    }

    const content = await prisma.content.findUnique({
      where: { id: parseInt(contentId) },
    });

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const previousStatus = content.status;
    const newStatus = normalizedAction === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // Perform database updates in a transaction to ensure atomicity
    const [updatedContent, log] = await prisma.$transaction([
      prisma.content.update({
        where: { id: content.id },
        data: { status: newStatus },
      }),
      prisma.moderationLog.create({
        data: {
          contentId: content.id,
          moderatorId,
          action: normalizedAction,
          previousStatus,
          newStatus,
          reason: reason || null,
        },
      }),
    ]);

    console.log(`[moderationController] Content #${content.id} ${normalizedAction}d by moderator #${moderatorId}`);

    return res.json({
      success: true,
      message: `Content ${normalizedAction.toLowerCase()}d successfully.`,
      data: {
        contentId: updatedContent.id,
        newStatus: updatedContent.status,
        logId: log.id
      }
    });
  } catch (error) {
    console.error('[moderationController] takeModerationAction error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * GET /api/moderation/history
 * Returns all content submissions with their AI analysis results.
 * Only accessible by MODERATOR role.
 */
const getAllHistory = async (req, res) => {
  try {
    const history = await prisma.content.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        aiAnalysisResult: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error('[moderationController] getAllHistory error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  getModerationQueue,
  takeModerationAction,
  getAllHistory,
};
