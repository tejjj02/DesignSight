const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const router = express.Router();
const Image = require('../models/Image');
const Project = require('../models/Project');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// GET /api/images - Get all images
router.get('/', async (req, res) => {
  try {
    const { projectId, status } = req.query;
    
    let query = {};
    if (projectId) query.projectId = projectId;
    if (status) query.analysisStatus = status;
    
    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .populate('projectId', 'name description');
    
    res.json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch images'
    });
  }
});

// POST /api/images/upload - Upload image to project
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { projectId, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }
    
    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Get image metadata using sharp
    const metadata = await sharp(req.file.path).metadata();
    
    // Create image record in database
    const image = new Image({
      projectId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        size: req.file.size,
        mimeType: req.file.mimetype
      },
      analysisStatus: 'pending'
    });
    
    await image.save();
    
    // Add image reference to project
    await Project.findByIdAndUpdate(
      projectId,
      { 
        $push: { images: image._id },
        updatedAt: Date.now()
      }
    );
    
    res.status(201).json({
      success: true,
      data: image,
      message: 'Image uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading image:', error);
    
    // Clean up uploaded file if database save failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

// GET /api/images/:id - Get specific image
router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id)
      .populate('projectId', 'name description');
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    res.json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch image'
    });
  }
});

// GET /api/images/:id/file - Serve image file
router.get('/:id/file', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    // Check if file exists
    try {
      await fs.access(image.path);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Image file not found on disk'
      });
    }
    
    // Set appropriate headers
    res.set({
      'Content-Type': image.metadata.mimeType,
      'Cache-Control': 'public, max-age=86400' // Cache for 1 day
    });
    
    res.sendFile(path.resolve(image.path));
    
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve image'
    });
  }
});

// PUT /api/images/:id/analysis-status - Update analysis status
router.put('/:id/analysis-status', async (req, res) => {
  try {
    const { status, results, errorMessage } = req.body;
    
    const updateData = {
      analysisStatus: status,
      updatedAt: Date.now()
    };
    
    if (results) {
      updateData['analysisResults.geminiResponse'] = results;
      updateData['analysisResults.processedAt'] = Date.now();
    }
    
    if (errorMessage) {
      updateData['analysisResults.errorMessage'] = errorMessage;
    }
    
    const image = await Image.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    res.json({
      success: true,
      data: image,
      message: 'Analysis status updated successfully'
    });
  } catch (error) {
    console.error('Error updating analysis status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update analysis status'
    });
  }
});

// DELETE /api/images/:id - Delete image
router.delete('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    // Remove from project's images array
    await Project.findByIdAndUpdate(
      image.projectId,
      { 
        $pull: { images: image._id },
        updatedAt: Date.now()
      }
    );
    
    // Delete image file from disk
    try {
      await fs.unlink(image.path);
    } catch (unlinkError) {
      console.error('Error deleting file from disk:', unlinkError);
    }
    
    // Delete image record from database
    await Image.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    });
  }
});

// POST /api/images/:id/analyze - Analyze image with Gemini AI
router.post('/:id/analyze', async (req, res) => {
  try {
    console.log('🤖 Analysis request received for image ID:', req.params.id);
    console.log('📝 Request body:', req.body);

    const { id } = req.params;
    const { role = 'designer', focusAreas = [], projectType = 'general' } = req.body;

    // Find the image
    console.log('🔍 Looking for image in database...');
    const image = await Image.findById(id);
    if (!image) {
      console.log('❌ Image not found in database');
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    console.log('✅ Image found:', image.filename, image.filePath);

    // Construct the correct image path - handle cases where filePath might be undefined
    let imagePath;
    if (image.filePath) {
      imagePath = path.join(__dirname, '..', image.filePath);
    } else {
      // Fallback: construct path from filename
      imagePath = path.join(__dirname, '..', 'uploads', image.filename);
    }
    
    console.log('📁 Checking file path:', imagePath);
    try {
      await fs.access(imagePath);
      console.log('✅ Image file exists on disk');
    } catch (error) {
      console.log('❌ Image file not found on disk:', error.message);
      return res.status(404).json({
        success: false,
        error: 'Image file not found on disk'
      });
    }

    // Import Gemini service
    console.log('🧠 Initializing Gemini service...');
    const geminiService = require('../services/gemini');

    // Update analysis status to processing
    console.log('📊 Updating image status to processing...');
    image.analysisStatus = 'processing';
    await image.save();

    // Analyze with Gemini
    console.log('🚀 Starting Gemini analysis...');
    const analysisResult = await geminiService.analyzeDesign(imagePath, {
      role,
      focusAreas,
      projectType
    });

    console.log('📋 Analysis result received:', {
      success: analysisResult.success,
      hasAnalysis: !!analysisResult.analysis,
      error: analysisResult.error
    });

    if (analysisResult.success) {
      console.log('✅ Analysis successful! Saving results...');
      // Update image with analysis results
      image.analysisStatus = 'completed';
      image.analysisData = analysisResult.analysis;
      image.analysisTimestamp = new Date();
      await image.save();

      // Save coordinate feedback to Feedback collection
      console.log('💾 Saving coordinate feedback...');
      const Feedback = require('../models/Feedback');
      const feedbackPromises = analysisResult.analysis.coordinateFeedback.map(feedback => {
        // Map categories from AI response to schema enums
        const categoryMapping = {
          'layout': 'visual_hierarchy',
          'typography': 'content',
          'color': 'visual_hierarchy',
          'spacing': 'visual_hierarchy',
          'accessibility': 'accessibility',
          'branding': 'content',
          'usability': 'ux_patterns',
          'navigation': 'ux_patterns'
        };

        // Map target roles  
        const targetRoleMapping = {
          'designer': ['designer'],
          'developer': ['developer'],
          'pm': ['pm'],
          'all': ['designer', 'developer', 'pm']
        };

        return new Feedback({
          imageId: image._id,
          category: categoryMapping[feedback.category] || 'visual_hierarchy',
          severity: feedback.severity,
          title: feedback.title,
          description: feedback.description,
          coordinates: {
            x: feedback.x,
            y: feedback.y,
            width: feedback.width || 50,
            height: feedback.height || 50
          },
          targetRoles: targetRoleMapping[feedback.targetRole] || ['designer'],
          recommendations: feedback.suggestion ? [feedback.suggestion] : [],
          status: 'open' // Use valid enum value
        }).save();
      });

      await Promise.all(feedbackPromises);
      console.log(`✅ Saved ${analysisResult.analysis.coordinateFeedback.length} feedback items`);

      res.json({
        success: true,
        message: 'Analysis completed successfully',
        analysis: analysisResult.analysis,
        imageId: image._id,
        feedbackCount: analysisResult.analysis.coordinateFeedback.length
      });
    } else {
      console.log('❌ Analysis failed:', analysisResult.error);
      // Handle analysis failure
      image.analysisStatus = 'failed';
      image.analysisError = analysisResult.error;
      await image.save();

      res.status(500).json({
        success: false,
        error: 'AI analysis failed',
        details: analysisResult.error,
        fallback: analysisResult.fallback
      });
    }
  } catch (error) {
    console.error('💥 Error analyzing image:', error);
    
    // Update image status on error
    try {
      const image = await Image.findById(req.params.id);
      if (image) {
        image.analysisStatus = 'failed';
        image.analysisError = error.message;
        await image.save();
      }
    } catch (updateError) {
      console.error('Error updating image status:', updateError);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to analyze image',
      details: error.message
    });
  }
});

// GET /api/images/:id/analysis - Get analysis results
router.get('/:id/analysis', async (req, res) => {
  try {
    const { id } = req.params;

    // Find the image with analysis data
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    // Get associated feedback
    const Feedback = require('../models/Feedback');
    const feedback = await Feedback.find({ imageId: id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      image: {
        _id: image._id,
        originalName: image.originalName,
        analysisStatus: image.analysisStatus,
        analysisData: image.analysisData,
        analysisTimestamp: image.analysisTimestamp,
        analysisError: image.analysisError
      },
      feedback,
      feedbackCount: feedback.length
    });
  } catch (error) {
    console.error('Error getting analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis results'
    });
  }
});

// GET /api/images/:id/download/json - Download feedback as JSON
router.get('/:id/download/json', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the image
    const image = await Image.findById(id).populate('projectId', 'name description');
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    // Get all feedback for this image
    const Feedback = require('../models/Feedback');
    const feedback = await Feedback.find({ imageId: id }).sort({ createdAt: -1 });
    
    // Get all comments for the feedback
    const Comment = require('../models/Comment');
    const feedbackIds = feedback.map(f => f._id);
    const comments = await Comment.find({ feedbackId: { $in: feedbackIds } }).sort({ createdAt: -1 });
    
    // Organize comments by feedbackId
    const commentsByFeedback = {};
    comments.forEach(comment => {
      const feedbackId = comment.feedbackId.toString();
      if (!commentsByFeedback[feedbackId]) {
        commentsByFeedback[feedbackId] = [];
      }
      commentsByFeedback[feedbackId].push(comment);
    });
    
    // Add comments to feedback items
    const feedbackWithComments = feedback.map(f => ({
      ...f.toObject(),
      comments: commentsByFeedback[f._id.toString()] || []
    }));
    
    const exportData = {
      export: {
        timestamp: new Date().toISOString(),
        format: 'json'
      },
      image: {
        id: image._id,
        filename: image.originalName,
        uploadedAt: image.createdAt,
        dimensions: {
          width: image.metadata.width,
          height: image.metadata.height
        }
      },
      project: image.projectId ? {
        id: image.projectId._id,
        name: image.projectId.name,
        description: image.projectId.description
      } : null,
      analysis: image.analysisData || null,
      feedback: feedbackWithComments,
      statistics: {
        totalFeedback: feedback.length,
        totalComments: comments.length,
        byCategory: feedback.reduce((acc, f) => {
          acc[f.category] = (acc[f.category] || 0) + 1;
          return acc;
        }, {}),
        bySeverity: feedback.reduce((acc, f) => {
          acc[f.severity] = (acc[f.severity] || 0) + 1;
          return acc;
        }, {}),
        byStatus: feedback.reduce((acc, f) => {
          acc[f.status] = (acc[f.status] || 0) + 1;
          return acc;
        }, {})
      }
    };
    
    const filename = `feedback-${image.originalName}-${Date.now()}.json`;
    
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    
    res.json(exportData);
    
  } catch (error) {
    console.error('Error downloading JSON:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download feedback as JSON'
    });
  }
});

// GET /api/images/:id/download/pdf - Download feedback as PDF
router.get('/:id/download/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the image
    const image = await Image.findById(id).populate('projectId', 'name description');
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    // Get all feedback for this image
    const Feedback = require('../models/Feedback');
    const feedback = await Feedback.find({ imageId: id }).sort({ createdAt: -1 });
    
    // Get all comments for the feedback
    const Comment = require('../models/Comment');
    const feedbackIds = feedback.map(f => f._id);
    const comments = await Comment.find({ feedbackId: { $in: feedbackIds } }).sort({ createdAt: -1 });
    
    // Organize comments by feedbackId
    const commentsByFeedback = {};
    comments.forEach(comment => {
      const feedbackId = comment.feedbackId.toString();
      if (!commentsByFeedback[feedbackId]) {
        commentsByFeedback[feedbackId] = [];
      }
      commentsByFeedback[feedbackId].push(comment);
    });
    
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    const filename = `feedback-${image.originalName}-${Date.now()}.pdf`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    
    doc.pipe(res);
    
    // Title
    doc.fontSize(20).text('Design Feedback Report', { align: 'center' });
    doc.moveDown();
    
    // Image info
    doc.fontSize(14).text(`Image: ${image.originalName}`);
    if (image.projectId) {
      doc.text(`Project: ${image.projectId.name}`);
    }
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.text(`Total Feedback Items: ${feedback.length}`);
    doc.moveDown();
    
    // Analysis summary if available
    if (image.analysisData) {
      doc.fontSize(16).text('AI Analysis Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(image.analysisData.summary || 'No summary available');
      doc.moveDown();
    }
    
    // Feedback items
    doc.fontSize(16).text('Feedback Items', { underline: true });
    doc.moveDown();
    
    feedback.forEach((item, index) => {
      const comments = commentsByFeedback[item._id.toString()] || [];
      
      // Add page break if needed
      if (doc.y > 650) {
        doc.addPage();
      }
      
      doc.fontSize(14).text(`${index + 1}. ${item.title}`, { continued: false });
      doc.fontSize(10).text(`Category: ${item.category} | Severity: ${item.severity} | Status: ${item.status}`);
      doc.fontSize(12).text(item.description, { continued: false });
      
      if (item.coordinates) {
        doc.fontSize(10).text(`Location: (${item.coordinates.x}, ${item.coordinates.y})`);
      }
      
      if (item.recommendations && item.recommendations.length > 0) {
        doc.text('Recommendations:');
        item.recommendations.forEach(rec => {
          doc.text(`• ${rec}`, { indent: 20 });
        });
      }
      
      // Add comments
      if (comments.length > 0) {
        doc.text('Comments:');
        comments.forEach(comment => {
          doc.text(`• ${comment.author.name}: ${comment.content}`, { indent: 20 });
        });
      }
      
      doc.moveDown();
    });
    
    // Statistics
    doc.addPage();
    doc.fontSize(16).text('Statistics', { underline: true });
    doc.moveDown();
    
    const categoryStats = feedback.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {});
    
    const severityStats = feedback.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    }, {});
    
    doc.fontSize(14).text('By Category:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      doc.fontSize(12).text(`${category}: ${count}`, { indent: 20 });
    });
    
    doc.moveDown();
    doc.fontSize(14).text('By Severity:');
    Object.entries(severityStats).forEach(([severity, count]) => {
      doc.fontSize(12).text(`${severity}: ${count}`, { indent: 20 });
    });
    
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF report'
    });
  }
});

module.exports = router;
