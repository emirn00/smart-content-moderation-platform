const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderationController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

/**
 * Access the Moderation Queue
 * GET /api/moderation/queue
 */
router.get(
  '/queue',
  verifyToken,
  authorizeRole(['MODERATOR']),
  moderationController.getModerationQueue
);

/**
 * Perform a Moderation Action (Approve/Reject)
 * POST /api/moderation/action
 */
router.post(
  '/action',
  verifyToken,
  authorizeRole(['MODERATOR']),
  moderationController.takeModerationAction
);

/**
 * Access Moderation Statistics
 * GET /api/moderation/stats
 */
router.get(
  '/stats',
  verifyToken,
  authorizeRole(['MODERATOR']),
  moderationController.getModerationStats
);

/**
 * Access the Full Content History
 * GET /api/moderation/history
 */
router.get(
  '/history',
  verifyToken,
  authorizeRole(['MODERATOR']),
  moderationController.getAllHistory
);

module.exports = router;
