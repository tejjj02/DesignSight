const express = require('express');
const router = express.Router();
const guidelineController = require('../controllers/guidelineController');

// POST /api/guidelines/generate – Generate a new fixing guideline
router.post('/generate', guidelineController.generateGuideline);

// GET /api/guidelines/image/:imageId – Get all guidelines for an image
router.get('/image/:imageId', guidelineController.getGuidelinesByImage);

// GET /api/guidelines/:id – Get a specific guideline
router.get('/:id', guidelineController.getGuideline);

// GET /api/guidelines/:id/download/pdf – Download guideline as PDF
router.get('/:id/download/pdf', guidelineController.downloadGuidelinePDF);

module.exports = router;
