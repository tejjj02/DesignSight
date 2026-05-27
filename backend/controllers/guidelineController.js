const mongoose = require('mongoose');
const guidelineService = require('../services/guidelineService');
const Guideline = require('../models/Guideline');
const Image = require('../models/Image');
const Feedback = require('../models/Feedback');
const path = require('path');
const fs = require('fs').promises;

// Valid enum values (mirrors model)
const VALID_STACKS = ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js'];
const VALID_STYLING = ['Tailwind CSS', 'CSS Modules', 'Styled Components', 'Chakra UI', 'Sass/SCSS', 'Plain CSS'];
const VALID_COMPONENTS = ['shadcn/ui', 'Material UI', 'Ant Design', 'Radix UI', 'Headless UI', 'None'];

/**
 * POST /api/guidelines/generate
 * Generate a fixing guideline from stored AI feedback
 */
exports.generateGuideline = async (req, res) => {
  try {
    const { projectId, imageId, frontendStack, stylingLibrary, componentLibrary } = req.body;

    // ── Validate required fields ────────────────────────────────────────────────
    if (!projectId || !imageId || !frontendStack || !stylingLibrary) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, imageId, frontendStack, stylingLibrary',
        code: 'VALIDATION_ERROR'
      });
    }

    // ── Validate ObjectIds ──────────────────────────────────────────────────────
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid projectId or imageId format',
        code: 'INVALID_ID'
      });
    }

    // ── Validate enum values ────────────────────────────────────────────────────
    if (!VALID_STACKS.includes(frontendStack)) {
      return res.status(400).json({
        success: false,
        error: `Invalid frontendStack. Must be one of: ${VALID_STACKS.join(', ')}`,
        code: 'INVALID_STACK'
      });
    }

    if (!VALID_STYLING.includes(stylingLibrary)) {
      return res.status(400).json({
        success: false,
        error: `Invalid stylingLibrary. Must be one of: ${VALID_STYLING.join(', ')}`,
        code: 'INVALID_STYLING'
      });
    }

    if (componentLibrary && !VALID_COMPONENTS.includes(componentLibrary)) {
      return res.status(400).json({
        success: false,
        error: `Invalid componentLibrary. Must be one of: ${VALID_COMPONENTS.join(', ')}`,
        code: 'INVALID_COMPONENT_LIB'
      });
    }

    // ── Check image exists and has completed analysis ───────────────────────────
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
        code: 'IMAGE_NOT_FOUND'
      });
    }

    if (image.analysisStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Image analysis must be completed before generating guidelines. Current status: ' + image.analysisStatus,
        code: 'ANALYSIS_NOT_COMPLETED'
      });
    }

    // ── Check feedback exists ───────────────────────────────────────────────────
    const feedbackCount = await Feedback.countDocuments({ imageId });
    if (feedbackCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'No feedback found for this image. Please run AI analysis first.',
        code: 'NO_FEEDBACK'
      });
    }

    // ── Generate guideline ──────────────────────────────────────────────────────
    console.log(`📋 GuidelineController: Generating guideline for imageId=${imageId}, stack=${frontendStack}`);

    const result = await guidelineService.generateRoadmap({
      projectId,
      imageId,
      frontendStack,
      stylingLibrary,
      componentLibrary: componentLibrary || 'None'
    });

    res.status(200).json({
      success: true,
      status: result.status,
      guidelineId: result.guidelineId,
      pdfUrl: result.pdfUrl,
      guidelines: result.guidelines,
      feedbackCount: result.feedbackCount,
      generatedAt: new Date().toISOString(),
      message: 'Guideline generated successfully'
    });

  } catch (error) {
    console.error('💥 GuidelineController: generateGuideline error:', error.message);

    if (error.message.includes('not found') || error.message.includes('No feedback')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOT_FOUND'
      });
    }

    if (error.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        error: 'AI generation timed out. Please retry.',
        code: 'TIMEOUT'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate guideline',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GENERATION_FAILED'
    });
  }
};

/**
 * GET /api/guidelines/:id
 * Get a stored guideline by ID
 */
exports.getGuidelineById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid guideline ID format',
        code: 'INVALID_ID'
      });
    }

    const guideline = await guidelineService.getGuidelineById(id);

    res.json({
      success: true,
      data: guideline
    });

  } catch (error) {
    if (error.message === 'Guideline not found') {
      return res.status(404).json({
        success: false,
        error: 'Guideline not found',
        code: 'NOT_FOUND'
      });
    }

    console.error('💥 GuidelineController: getGuidelineById error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve guideline',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * GET /api/guidelines/image/:imageId
 * Get all guidelines for a specific image
 */
exports.getGuidelinesByImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid imageId format',
        code: 'INVALID_ID'
      });
    }

    const guidelines = await Guideline.find({ imageId })
      .sort({ createdAt: -1 })
      .populate('projectId', 'name')
      .lean();

    res.json({
      success: true,
      count: guidelines.length,
      data: guidelines
    });

  } catch (error) {
    console.error('💥 GuidelineController: getGuidelinesByImage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve guidelines',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * GET /api/guidelines/:id/pdf
 * Download the generated PDF for a guideline
 */
exports.downloadGuidelinePdf = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid guideline ID format',
        code: 'INVALID_ID'
      });
    }

    const guideline = await Guideline.findById(id);
    if (!guideline) {
      return res.status(404).json({
        success: false,
        error: 'Guideline not found',
        code: 'NOT_FOUND'
      });
    }

    if (!guideline.pdfUrl) {
      return res.status(404).json({
        success: false,
        error: 'PDF not yet generated for this guideline',
        code: 'PDF_NOT_FOUND'
      });
    }

    const pdfPath = path.join(__dirname, '..', '..', guideline.pdfUrl);

    try {
      await fs.access(pdfPath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'PDF file not found on disk',
        code: 'PDF_FILE_MISSING'
      });
    }

    const filename = `guideline-${guideline.frontendStack}-${guideline._id}.pdf`
      .replace(/\s+/g, '-').toLowerCase();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    });

    res.sendFile(path.resolve(pdfPath));

  } catch (error) {
    console.error('💥 GuidelineController: downloadGuidelinePdf error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download PDF',
      code: 'INTERNAL_ERROR'
    });
  }
};
