const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const Image = require('../models/Image');
const Project = require('../models/Project');
const Feedback = require('../models/Feedback');
const Comment = require('../models/Comment');
const geminiService = require('../services/gemini');

exports.getAllImages = async (req, res) => {
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
};

exports.uploadImage = async (req, res) => {
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
};

exports.getImage = async (req, res) => {
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
};

exports.serveImageFile = async (req, res) => {
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
};

exports.updateAnalysisStatus = async (req, res) => {
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
};

exports.deleteImage = async (req, res) => {
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
};

exports.analyzeImage = async (req, res) => {
  try {
    console.log('🤖 Analysis request received for image ID:', req.params.id);
    const { id } = req.params;
    const { role = 'designer', focusAreas = [], projectType = 'general' } = req.body;

    // Find the image
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    // Construct the correct image path
    let imagePath;
    if (image.path) { // image.path is stored in DB
      imagePath = path.join(__dirname, '..', '..', image.path);
    } else {
      imagePath = path.join(__dirname, '..', '..', 'uploads', image.filename);
    }
    
    try {
      await fs.access(imagePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Image file not found on disk'
      });
    }

    // Update analysis status to processing
    image.analysisStatus = 'processing';
    await image.save();

    // Analyze with Gemini
    const analysisResult = await geminiService.analyzeDesign(imagePath, {
      role,
      focusAreas,
      projectType
    });

    if (analysisResult.success) {
      // Update image with analysis results
      image.analysisStatus = 'completed';
      image.analysisData = analysisResult.analysis;
      image.analysisTimestamp = new Date();
      await image.save();

      // Save coordinate feedback to Feedback collection
      const feedbackPromises = analysisResult.analysis.coordinateFeedback.map(feedback => {
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
          status: 'open'
        }).save();
      });

      await Promise.all(feedbackPromises);

      res.json({
        success: true,
        message: 'Analysis completed successfully',
        analysis: analysisResult.analysis,
        imageId: image._id,
        feedbackCount: analysisResult.analysis.coordinateFeedback.length
      });
    } else {
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
};

exports.getAnalysis = async (req, res) => {
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
    const feedback = await Feedback.find({ imageId: id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      image: {
        _id: image._id,
        projectId: image.projectId,
        originalName: image.originalName,
        filename: image.filename,
        metadata: image.metadata,
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
};

exports.downloadJSON = async (req, res) => {
  try {
    const { id } = req.params;
    
    const image = await Image.findById(id).populate('projectId', 'name description');
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    const feedback = await Feedback.find({ imageId: id }).sort({ createdAt: -1 });
    const feedbackIds = feedback.map(f => f._id);
    const comments = await Comment.find({ feedbackId: { $in: feedbackIds } }).sort({ createdAt: -1 });
    
    const commentsByFeedback = {};
    comments.forEach(comment => {
      const feedbackId = comment.feedbackId.toString();
      if (!commentsByFeedback[feedbackId]) {
        commentsByFeedback[feedbackId] = [];
      }
      commentsByFeedback[feedbackId].push(comment);
    });
    
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
};

exports.downloadPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    const image = await Image.findById(id).populate('projectId', 'name description');
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    const feedback = await Feedback.find({ imageId: id }).sort({ createdAt: -1 });
    const feedbackIds = feedback.map(f => f._id);
    const comments = await Comment.find({ feedbackId: { $in: feedbackIds } }).sort({ createdAt: -1 });
    
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
    
    doc.fontSize(20).text('Design Feedback Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text(`Image: ${image.originalName}`);
    if (image.projectId) {
      doc.text(`Project: ${image.projectId.name}`);
    }
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.text(`Total Feedback Items: ${feedback.length}`);
    doc.moveDown();
    
    if (image.analysisData) {
      doc.fontSize(16).text('AI Analysis Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(image.analysisData.summary || 'No summary available');
      doc.moveDown();
    }
    
    doc.fontSize(16).text('Feedback Items', { underline: true });
    doc.moveDown();
    
    feedback.forEach((item, index) => {
      const comments = commentsByFeedback[item._id.toString()] || [];
      
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
      
      if (comments.length > 0) {
        doc.text('Comments:');
        comments.forEach(comment => {
          doc.text(`• ${comment.author.name || comment.author}: ${comment.content}`, { indent: 20 });
        });
      }
      
      doc.moveDown();
    });
    
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
};
