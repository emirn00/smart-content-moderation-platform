const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/moderation/queue
 * Returns all contents with status FLAGGED for manual review.
 * Only accessible by MODERATOR role.
 */
const getModerationQueue = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [queue, totalCount] = await prisma.$transaction([
      prisma.content.findMany({
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
        skip,
        take: limit,
      }),
      prisma.content.count({
        where: {
          status: 'FLAGGED',
        },
      }),
    ]);

    return res.json({
      success: true,
      count: queue.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status; // Optional status filter

    const where = {};
    if (status && status !== 'ALL') {
      // Handle the case where "PENDING" might refer to multiple statuses
      if (status === 'PENDING') {
        where.status = {
          in: ['PENDING', 'FLAGGED']
        };
      } else {
        where.status = status;
      }
    }

    const [history, totalCount] = await prisma.$transaction([
      prisma.content.findMany({
        where,
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
        skip,
        take: limit,
      }),
      prisma.content.count({
        where,
      }),
    ]);

    return res.json({
      success: true,
      count: history.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      history
    });
  } catch (error) {
    console.error('[moderationController] getAllHistory error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * GET /api/moderation/stats
 * Returns summary statistics and time-series data for visuals.
 * Only accessible by MODERATOR role.
 */
const getModerationStats = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // 1. Time-series Data (last 7 days)
    const dailySubmissions = await prisma.content.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    // Post-process grouping by date only
    const dailyMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i + 1);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap[dateStr] = 0;
    }

    dailySubmissions.forEach(sub => {
      const dateStr = sub.createdAt.toISOString().split('T')[0];
      if (dailyMap[dateStr] !== undefined) {
        dailyMap[dateStr] += sub._count.id;
      }
    });

    const timeSeriesData = Object.keys(dailyMap).map(date => ({
      date,
      count: dailyMap[date],
    }));

    // 2. Verdict Distribution (AiAnalysisResult)
    const verdicts = await prisma.aiAnalysisResult.groupBy({
      by: ['verdict'],
      _count: {
        id: true,
      },
    });

    // 3. Status Distribution (Content)
    const statuses = await prisma.content.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    return res.json({
      success: true,
      data: {
        timeSeriesData,
        verdicts: verdicts.map(v => ({ name: v.verdict, value: v._count.id })),
        statuses: statuses.map(s => ({ name: s.status, value: s._count.id })),
      },
    });
  } catch (error) {
    console.error('[moderationController] getModerationStats error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  getModerationQueue,
  takeModerationAction,
  getAllHistory,
  getModerationStats,
};
