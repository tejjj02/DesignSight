const Guideline = require('../models/Guideline');
const Feedback  = require('../models/Feedback');
const Image     = require('../models/Image');
const guidelineService = require('../services/guidelineService');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs   = require('fs').promises;

// ─── POST /api/guidelines/generate ─────────────────────────────────────────────
exports.generateGuideline = async (req, res) => {
  try {
    const {
      projectId,
      imageId,
      frontendStack    = 'react',
      stylingLibrary   = 'tailwind',
      componentLibrary = 'none'
    } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!projectId || !imageId || !frontendStack) {
      return res.status(400).json({
        success: false,
        error: 'projectId, imageId, and frontendStack are required'
      });
    }

    const validStacks = ['react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'vanilla'];
    if (!validStacks.includes(frontendStack)) {
      return res.status(400).json({
        success: false,
        error: `Invalid frontendStack. Must be one of: ${validStacks.join(', ')}`
      });
    }

    // ── Verify image exists ─────────────────────────────────────────────────
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    // ── Fetch feedback from MongoDB ─────────────────────────────────────────
    const feedbackItems = await Feedback.find({ imageId }).sort({ createdAt: -1 });
    if (!feedbackItems.length) {
      return res.status(422).json({
        success: false,
        error: 'No feedback found for this image. Run AI analysis first.'
      });
    }

    // ── Create guideline record (pending) ───────────────────────────────────
    const guideline = new Guideline({
      projectId,
      imageId,
      frontendStack,
      stylingLibrary,
      componentLibrary,
      generationStatus: 'processing'
    });
    await guideline.save();

    // ── Call Gemini service ─────────────────────────────────────────────────
    const result = await guidelineService.generateGuidelines({
      feedbackItems,
      frontendStack,
      stylingLibrary,
      componentLibrary
    });

    if (result.success) {
      guideline.generatedGuidelines = {
        ...result.guidelines,
        generatedAt: new Date()
      };
      guideline.generationStatus = 'completed';
    } else {
      // Use fallback but still mark completed so UI gets something
      guideline.generatedGuidelines = {
        ...result.fallback,
        generatedAt: new Date()
      };
      guideline.generationStatus = 'completed';
      guideline.errorMessage = result.error;
    }

    await guideline.save();

    res.status(201).json({
      success: true,
      guidelineId: guideline._id,
      guideline: guideline.generatedGuidelines,
      generationStatus: guideline.generationStatus,
      usedFallback: !result.success,
      message: result.success
        ? 'Fixing guideline generated successfully'
        : 'Guideline generated using fallback (AI partial failure)'
    });

  } catch (error) {
    console.error('💥 GuidelineController.generateGuideline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate guideline',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ─── GET /api/guidelines/:id ────────────────────────────────────────────────────
exports.getGuideline = async (req, res) => {
  try {
    const guideline = await Guideline.findById(req.params.id)
      .populate('imageId', 'originalName analysisStatus')
      .populate('projectId', 'name');

    if (!guideline) {
      return res.status(404).json({ success: false, error: 'Guideline not found' });
    }

    res.json({ success: true, guideline });
  } catch (error) {
    console.error('GuidelineController.getGuideline:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch guideline' });
  }
};

// ─── GET /api/guidelines/image/:imageId ─────────────────────────────────────────
exports.getGuidelinesByImage = async (req, res) => {
  try {
    const guidelines = await Guideline
      .find({ imageId: req.params.imageId })
      .sort({ createdAt: -1 });

    res.json({ success: true, guidelines, count: guidelines.length });
  } catch (error) {
    console.error('GuidelineController.getGuidelinesByImage:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch guidelines' });
  }
};

// ─── GET /api/guidelines/:id/download/pdf ──────────────────────────────────────
exports.downloadGuidelinePDF = async (req, res) => {
  try {
    const guideline = await Guideline.findById(req.params.id)
      .populate('imageId', 'originalName')
      .populate('projectId', 'name');

    if (!guideline) {
      return res.status(404).json({ success: false, error: 'Guideline not found' });
    }
    if (guideline.generationStatus !== 'completed') {
      return res.status(422).json({ success: false, error: 'Guideline generation not yet complete' });
    }

    const g   = guideline.generatedGuidelines;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    const filename = `guideline-${guideline.frontendStack}-${Date.now()}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    doc.pipe(res);

    // ── Cover ─────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 180).fill('#0a0a0a');
    doc.fill('#ffffff')
       .font('Helvetica-Bold')
       .fontSize(28)
       .text('DesignSight', 50, 50, { align: 'center' });
    doc.fontSize(14)
       .font('Helvetica')
       .text('AI Fixing Guideline Report', 50, 88, { align: 'center' });

    const meta = [
      `Project: ${guideline.projectId?.name || 'N/A'}`,
      `Image: ${guideline.imageId?.originalName || 'N/A'}`,
      `Stack: ${guideline.frontendStack} / ${guideline.stylingLibrary}`,
      `Generated: ${new Date(g.generatedAt || Date.now()).toLocaleDateString()}`
    ];
    doc.fontSize(10).fill('#aaaaaa');
    meta.forEach((line, i) => doc.text(line, 50, 115 + i * 14, { align: 'center' }));

    doc.fill('#000000').moveDown(6);

    // ── Executive Summary ────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#10a37f').text('Executive Summary');
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(11).fillColor('#333333').text(g.executiveSummary || '', { lineGap: 4 });
    doc.moveDown(1.5);

    // ── Priority Roadmap ─────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#10a37f').text('Priority Roadmap');
    doc.moveDown(0.4);
    (g.priorityRoadmap || []).forEach(phase => {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#222222')
         .text(`Phase ${phase.phase}: ${phase.label}  (${phase.timeEstimate})`);
      doc.font('Helvetica').fontSize(10).fillColor('#555555')
         .text(`Covers ${phase.issues?.length || 0} issue(s)`);
      doc.moveDown(0.6);
    });
    doc.moveDown(0.5);

    // ── Issue Breakdown ──────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#10a37f').text('Issue Breakdown');
    doc.moveDown(0.4);

    (g.issueBreakdown || []).forEach((issue, idx) => {
      if (doc.y > 680) doc.addPage();

      const severityColor = { high: '#ef4444', medium: '#f59e0b', low: '#38bdf8' }[issue.severity] || '#888888';

      doc.font('Helvetica-Bold').fontSize(13).fillColor('#111111')
         .text(`${idx + 1}. ${issue.title}`);
      doc.font('Helvetica').fontSize(10).fillColor(severityColor)
         .text(`Severity: ${issue.severity?.toUpperCase()} | Category: ${issue.category}`);
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(11).fillColor('#333333')
         .text(issue.description || '', { lineGap: 3 });
      doc.moveDown(0.3);

      if (issue.fixImplementation) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#0ea5e9').text('Fix Implementation:');
        doc.font('Helvetica').fontSize(10).fillColor('#444444')
           .text(issue.fixImplementation, { lineGap: 3 });
      }
      if (issue.codeSnippet) {
        doc.moveDown(0.3);
        doc.font('Courier').fontSize(9).fillColor('#1a1a2e')
           .text(issue.codeSnippet, { lineGap: 2 });
      }
      doc.moveDown(1);
    });

    // ── Accessibility Fixes ──────────────────────────────────────────
    if ((g.accessibilityFixes || []).length) {
      if (doc.y > 600) doc.addPage();
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#10a37f').text('Accessibility Fixes (WCAG)');
      doc.moveDown(0.4);
      g.accessibilityFixes.forEach(fix => {
        doc.font('Helvetica').fontSize(11).fillColor('#333333').text(`• ${fix}`, { lineGap: 3 });
      });
      doc.moveDown(1);
    }

    // ── Technical Recommendations ────────────────────────────────────
    if ((g.technicalRecommendations || []).length) {
      if (doc.y > 620) doc.addPage();
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#10a37f').text('Technical Recommendations');
      doc.moveDown(0.4);
      g.technicalRecommendations.forEach(rec => {
        doc.font('Helvetica').fontSize(11).fillColor('#333333').text(`• ${rec}`, { lineGap: 3 });
      });
    }

    doc.end();

  } catch (error) {
    console.error('GuidelineController.downloadGuidelinePDF:', error);
    res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
};
