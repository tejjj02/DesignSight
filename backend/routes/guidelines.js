const express = require('express');
const router = express.Router();
const guidelineController = require('../controllers/guidelineController');

/**
 * Guideline Routes
 * Base path: /api/guidelines
 */

// POST /api/guidelines/generate - Generate a new fixing guideline
router.post('/generate', guidelineController.generateGuideline);

// GET /api/guidelines/image/:imageId - Get all guidelines for an image
router.get('/image/:imageId', guidelineController.getGuidelinesByImage);

// GET /api/guidelines/:id - Get a specific guideline by ID
router.get('/:id', guidelineController.getGuidelineById);

// GET /api/guidelines/:id/pdf - Download guideline PDF
router.get('/:id/pdf', guidelineController.downloadGuidelinePdf);

module.exports = router;
