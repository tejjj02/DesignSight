const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentsController');

// GET /api/comments - Get comments with filtering
router.get('/', commentsController.getComments);

// GET /api/comments/thread/:feedbackId - Get comment tree for feedback
router.get('/thread/:feedbackId', commentsController.getCommentThread);

// POST /api/comments - Create new comment
router.post('/', commentsController.createComment);

// GET /api/comments/:id - Get specific comment
router.get('/:id', commentsController.getCommentById);

// PUT /api/comments/:id - Update comment
router.put('/:id', commentsController.updateComment);

// DELETE /api/comments/:id - Soft delete comment
router.delete('/:id', commentsController.deleteComment);

// POST /api/comments/:id/reaction - Add reaction to comment
router.post('/:id/reaction', commentsController.addReaction);

// DELETE /api/comments/:id/reaction - Remove reaction from comment
router.delete('/:id/reaction', commentsController.removeReaction);

// GET /api/comments/:id/replies - Get direct replies to a comment
router.get('/:id/replies', commentsController.getReplies);

module.exports = router;
