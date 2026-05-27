const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Guideline = require('../models/Guideline');
const Feedback = require('../models/Feedback');
const Image = require('../models/Image');
const geminiPromptBuilder = require('./geminiPromptBuilder');

class GuidelineService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
    });
    this.maxRetries = 3;
    this.timeoutMs = 20000; // 20-second timeout per LLD spec
  }

  /**
   * Main orchestration method: fetch feedback → build prompt → call Gemini → store → generate PDF
   * @param {Object} params - { projectId, imageId, frontendStack, stylingLibrary, componentLibrary }
   * @returns {Promise<Object>} - Generated guideline data
   */
  async generateRoadmap(params) {
    const { projectId, imageId, frontendStack, stylingLibrary, componentLibrary } = params;

    console.log(`🔧 GuidelineService: Starting guideline generation for imageId=${imageId}`);

    // 1. Verify image exists
    const image = await Image.findById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    // 2. Verify feedback exists for this image
    const feedbackItems = await Feedback.find({ imageId }).lean();
    if (!feedbackItems || feedbackItems.length === 0) {
      throw new Error('No feedback found for this image. Please run AI analysis first.');
    }

    console.log(`📋 GuidelineService: Found ${feedbackItems.length} feedback items`);

    // 3. Create initial guideline record
    const guideline = new Guideline({
      projectId,
      imageId,
      frontendStack,
      stylingLibrary,
      componentLibrary: componentLibrary || 'None',
      generationStatus: 'processing',
      feedbackCount: feedbackItems.length
    });
    await guideline.save();

    try {
      // 4. Build Gemini prompt
      const techStack = { frontendStack, stylingLibrary, componentLibrary: componentLibrary || 'None' };
      const prompt = geminiPromptBuilder.buildSanitizedPrompt(feedbackItems, techStack);

      console.log(`📝 GuidelineService: Prompt built (${prompt.length} chars)`);

      // 5. Call Gemini with retry logic
      const generatedGuidelines = await this.callGeminiWithRetry(prompt);

      console.log(`✅ GuidelineService: Gemini response received`);

      // 6. Generate PDF
      const pdfPath = await this.generatePdf(guideline._id, generatedGuidelines, {
        image, feedbackItems, frontendStack, stylingLibrary, componentLibrary
      });

      // 7. Update guideline record with results
      guideline.generatedGuidelines = generatedGuidelines;
      guideline.pdfUrl = pdfPath;
      guideline.generationStatus = 'completed';
      await guideline.save();

      console.log(`🎉 GuidelineService: Guideline saved with id=${guideline._id}`);

      return {
        guidelineId: guideline._id,
        guidelines: generatedGuidelines,
        pdfUrl: pdfPath,
        feedbackCount: feedbackItems.length,
        status: 'completed'
      };
    } catch (error) {
      console.error(`💥 GuidelineService: Generation failed:`, error.message);

      // Mark guideline as failed
      guideline.generationStatus = 'failed';
      guideline.errorMessage = error.message;
      await guideline.save();

      throw error;
    }
  }

  /**
   * Call Gemini API with retry + exponential backoff
   * @param {string} prompt
   * @returns {Promise<Object>} Parsed guideline JSON
   */
  async callGeminiWithRetry(prompt) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🚀 GuidelineService: Gemini attempt ${attempt}/${this.maxRetries}`);

        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), this.timeoutMs)
        );

        // Create Gemini call promise
        const geminiPromise = this.model.generateContent(prompt);

        // Race between timeout and API call
        const result = await Promise.race([geminiPromise, timeoutPromise]);
        const response = await result.response;
        const text = response.text();

        // Parse and validate the response
        return this.parseGuidelineResponse(text);
      } catch (error) {
        lastError = error;
        console.error(`⚠️ GuidelineService: Attempt ${attempt} failed: ${error.message}`);

        if (attempt < this.maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ GuidelineService: Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Gemini failed after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Parse and validate the Gemini guideline response
   * @param {string} responseText
   * @returns {Object} Parsed guideline
   */
  parseGuidelineResponse(responseText) {
    try {
      let cleanText = responseText.trim();
      // Remove markdown code blocks if present
      cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
      cleanText = cleanText.replace(/^```\s*/i, '').replace(/```\s*$/i, '');

      const parsed = JSON.parse(cleanText);

      // Validate required fields
      if (!parsed.executiveSummary) {
        throw new Error('Missing executiveSummary in guideline response');
      }
      if (!Array.isArray(parsed.componentFixes)) {
        parsed.componentFixes = [];
      }
      if (!Array.isArray(parsed.priorityRoadmap)) {
        parsed.priorityRoadmap = [];
      }

      return parsed;
    } catch (error) {
      console.error('❌ GuidelineService: Failed to parse Gemini response:', error.message);
      console.error('Raw response:', responseText.substring(0, 500));

      // Return fallback structure
      return this.getFallbackGuideline();
    }
  }

  /**
   * Generate PDF for the guideline
   * @param {string} guidelineId
   * @param {Object} guidelines - Parsed guideline data
   * @param {Object} context - { image, feedbackItems, frontendStack, stylingLibrary, componentLibrary }
   * @returns {Promise<string>} PDF file path
   */
  async generatePdf(guidelineId, guidelines, context) {
    const PDFDocument = require('pdfkit');
    const { image, feedbackItems, frontendStack, stylingLibrary, componentLibrary } = context;

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const pdfFilename = `guideline-${guidelineId}-${Date.now()}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFilename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(pdfPath);

        doc.pipe(stream);

        // ── Cover Page ──────────────────────────────────────────────────────────
        doc.fontSize(28).fillColor('#1a1a2e').text('DesignSight', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(18).fillColor('#16213e').text('AI Fixing Guideline Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#444').text(`Image: ${image.originalName}`, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`, { align: 'center' });
        doc.moveDown(0.3);
        doc.text(`Tech Stack: ${frontendStack} + ${stylingLibrary}${componentLibrary !== 'None' ? ' + ' + componentLibrary : ''}`, { align: 'center' });
        doc.moveDown(2);

        // ── Executive Summary ───────────────────────────────────────────────────
        this.pdfSection(doc, 'Executive Summary');
        const exec = guidelines.executiveSummary || {};
        doc.fontSize(11).fillColor('#222').text(exec.overview || 'No overview provided.');
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#555')
          .text(`Total Issues: ${exec.totalIssues || feedbackItems.length}`)
          .text(`Critical Issues: ${exec.criticalCount || 0}`)
          .text(`Estimated Effort: ${exec.estimatedEffort || 'N/A'}`);
        doc.moveDown(1);

        // ── Priority Roadmap ────────────────────────────────────────────────────
        if (guidelines.priorityRoadmap && guidelines.priorityRoadmap.length > 0) {
          this.pdfSection(doc, 'Priority Roadmap');
          guidelines.priorityRoadmap.forEach((phase, idx) => {
            if (doc.y > 700) doc.addPage();
            doc.fontSize(12).fillColor('#16213e')
              .text(`Phase ${phase.priority || idx + 1}: ${phase.title || phase.phase || 'Untitled'}`);
            doc.fontSize(10).fillColor('#555').text(phase.description || '');
            if (phase.estimatedHours) {
              doc.fillColor('#888').text(`Estimated: ~${phase.estimatedHours} hours`);
            }
            doc.moveDown(0.5);
          });
          doc.moveDown(0.5);
        }

        // ── Component Fixes ─────────────────────────────────────────────────────
        if (guidelines.componentFixes && guidelines.componentFixes.length > 0) {
          this.pdfSection(doc, 'Component-Level Fixes');
          guidelines.componentFixes.forEach((fix, idx) => {
            if (doc.y > 680) doc.addPage();
            const sevColor = fix.severity === 'high' ? '#c0392b' : fix.severity === 'medium' ? '#f39c12' : '#2980b9';
            doc.fontSize(12).fillColor(sevColor)
              .text(`${idx + 1}. [${(fix.severity || 'low').toUpperCase()}] ${fix.component || 'Component'}`);
            doc.fontSize(10).fillColor('#333').text(`Issue: ${fix.issue || ''}`);
            if (fix.implementation?.description) {
              doc.fillColor('#555').text(`Fix: ${fix.implementation.description}`);
            }
            if (fix.implementation?.codeExample) {
              doc.moveDown(0.3);
              doc.fontSize(9).fillColor('#444')
                .text('Code Example:', { continued: false })
                .text(fix.implementation.codeExample.substring(0, 400), {
                  indent: 10, lineGap: 2
                });
            }
            doc.moveDown(0.8);
          });
        }

        // ── Accessibility Fixes ─────────────────────────────────────────────────
        if (guidelines.accessibilityFixes && guidelines.accessibilityFixes.length > 0) {
          doc.addPage();
          this.pdfSection(doc, 'Accessibility Fixes (WCAG 2.1)');
          guidelines.accessibilityFixes.forEach((fix, idx) => {
            if (doc.y > 700) doc.addPage();
            doc.fontSize(11).fillColor('#27ae60')
              .text(`${idx + 1}. ${fix.wcagGuideline || 'WCAG Guideline'}`);
            doc.fontSize(10).fillColor('#333').text(`Issue: ${fix.issue || ''}`);
            doc.fillColor('#555').text(`Fix: ${fix.implementation || ''}`);
            doc.moveDown(0.5);
          });
        }

        // ── Responsive Fixes ────────────────────────────────────────────────────
        if (guidelines.responsiveFixes && guidelines.responsiveFixes.length > 0) {
          if (doc.y > 600) doc.addPage();
          this.pdfSection(doc, 'Responsive Design Fixes');
          guidelines.responsiveFixes.forEach((fix, idx) => {
            if (doc.y > 700) doc.addPage();
            doc.fontSize(11).fillColor('#8e44ad')
              .text(`${idx + 1}. [${fix.breakpoint || 'all'}] ${fix.issue || ''}`);
            doc.fontSize(10).fillColor('#555').text(`Fix: ${fix.implementation || ''}`);
            doc.moveDown(0.5);
          });
        }

        // ── Testing Recommendations ─────────────────────────────────────────────
        if (guidelines.testingRecommendations && guidelines.testingRecommendations.length > 0) {
          if (doc.y > 600) doc.addPage();
          this.pdfSection(doc, 'Testing Recommendations');
          guidelines.testingRecommendations.forEach((test, idx) => {
            doc.fontSize(10).fillColor('#333')
              .text(`${idx + 1}. [${test.testType || 'test'}] ${test.description || ''}`)
              .text(`   Tool: ${test.tool || 'N/A'}`, { fillColor: '#777' });
            doc.moveDown(0.4);
          });
        }

        // ── Footer ──────────────────────────────────────────────────────────────
        doc.addPage();
        doc.fontSize(10).fillColor('#aaa')
          .text(`Generated by DesignSight AI Fixing Guideline Generator`, { align: 'center' })
          .text(`${new Date().toISOString()}`, { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          console.log(`📄 GuidelineService: PDF generated at ${pdfPath}`);
          resolve(`uploads/${pdfFilename}`);
        });
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper: Add a styled section header to PDF
   */
  pdfSection(doc, title) {
    doc.fontSize(15).fillColor('#0f3460')
      .text(title, { underline: true });
    doc.moveDown(0.5);
  }

  /**
   * Retrieve a stored guideline by ID
   * @param {string} guidelineId
   * @returns {Promise<Object>}
   */
  async getGuidelineById(guidelineId) {
    const guideline = await Guideline.findById(guidelineId)
      .populate('imageId', 'originalName filename metadata analysisStatus')
      .populate('projectId', 'name description');

    if (!guideline) {
      throw new Error('Guideline not found');
    }

    return guideline;
  }

  /**
   * Fallback guideline structure when Gemini parsing fails
   * @returns {Object}
   */
  getFallbackGuideline() {
    return {
      executiveSummary: {
        totalIssues: 0,
        criticalCount: 0,
        overview: 'Guideline generation encountered an issue. Please retry.',
        estimatedEffort: 'Unknown'
      },
      priorityRoadmap: [],
      componentFixes: [],
      accessibilityFixes: [],
      responsiveFixes: [],
      refactoringRecommendations: [],
      technicalDebtNotes: [],
      testingRecommendations: []
    };
  }
}

module.exports = new GuidelineService();
