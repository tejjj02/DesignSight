const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// GET /api/feedback - Get all feedback with filtering
router.get('/', feedbackController.getFeedback);

// POST /api/feedback - Create new feedback
router.post('/', feedbackController.createFeedback);

// GET /api/feedback/:id - Get specific feedback
router.get('/:id', feedbackController.getFeedbackById);

// PUT /api/feedback/:id - Update feedback
router.put('/:id', feedbackController.updateFeedback);

// DELETE /api/feedback/:id - Delete feedback
router.delete('/:id', feedbackController.deleteFeedback);

// GET /api/feedback/role/:role - Get feedback filtered by role
router.get('/role/:role', feedbackController.getFeedbackByRole);

// GET /api/feedback/stats/:imageId - Get feedback statistics for an image
router.get('/stats/:imageId', feedbackController.getFeedbackStats);

// GET /api/feedback/:id/comments - Get comments for specific feedback
router.get('/:id/comments', feedbackController.getFeedbackComments);

module.exports = router;
