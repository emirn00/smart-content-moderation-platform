const express = require('express');
const { submitContent, getMyContents, getContentById } = require('../controllers/contentController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// POST /api/contents — submit content for AI moderation (any authenticated user)
router.post('/', verifyToken, submitContent);

// GET /api/contents/me — get caller's own submissions
router.get('/me', verifyToken, getMyContents);

// GET /api/contents/:id — get a specific content by ID (owner or moderator)
router.get('/:id', verifyToken, getContentById);

module.exports = router;
