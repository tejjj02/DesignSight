const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Image = require('../models/Image');

// GET /api/feedback - Get all feedback with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      imageId, 
      category, 
      severity, 
      role, 
      status, 
      projectId,
      limit = 50,
      page = 1 
    } = req.query;
    
    let query = {};
    
    // Build query filters
    if (imageId) query.imageId = imageId;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (role) query.targetRoles = { $in: [role] };
    
    // If projectId is provided, first get all images for that project
    if (projectId) {
      const images = await Image.find({ projectId }, '_id');
      const imageIds = images.map(img => img._id);
      query.imageId = { $in: imageIds };
    }
    
    const skip = (page - 1) * limit;
    
    const feedback = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('imageId', 'filename originalName metadata projectId')
      .populate({
        path: 'imageId',
        populate: {
          path: 'projectId',
          select: 'name description'
        }
      });
    
    const total = await Feedback.countDocuments(query);
    
    res.json({
      success: true,
      count: feedback.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    });
  }
});

// POST /api/feedback - Create new feedback
router.post('/', async (req, res) => {
  try {
    const {
      imageId,
      category,
      severity,
      title,
      description,
      coordinates,
      targetRoles,
      recommendations,
      tags,
      priority
    } = req.body;
    
    // Validate required fields
    if (!imageId || !category || !severity || !title || !description || !coordinates || !targetRoles) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: imageId, category, severity, title, description, coordinates, targetRoles'
      });
    }
    
    // Validate image exists
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    // Validate coordinates are within image bounds
    const { x, y, width, height } = coordinates;
    if (x < 0 || y < 0 || 
        x + width > image.metadata.width || 
        y + height > image.metadata.height) {
      return res.status(400).json({
        success: false,
        error: 'Coordinates are outside image bounds'
      });
    }
    
    const feedback = new Feedback({
      imageId,
      category,
      severity,
      title,
      description,
      coordinates,
      targetRoles,
      recommendations: recommendations || [],
      tags: tags || [],
      priority: priority || 3
    });
    
    await feedback.save();
    
    // Populate the response
    await feedback.populate('imageId', 'filename originalName metadata projectId');
    
    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback created successfully'
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create feedback'
    });
  }
});

// GET /api/feedback/:id - Get specific feedback
router.get('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('imageId', 'filename originalName metadata projectId')
      .populate({
        path: 'imageId',
        populate: {
          path: 'projectId',
          select: 'name description'
        }
      });
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    });
  }
});

// PUT /api/feedback/:id - Update feedback
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      coordinates,
      targetRoles,
      recommendations,
      status,
      priority,
      tags
    } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (coordinates) updateData.coordinates = coordinates;
    if (targetRoles) updateData.targetRoles = targetRoles;
    if (recommendations) updateData.recommendations = recommendations;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (tags) updateData.tags = tags;
    
    updateData.updatedAt = Date.now();
    
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('imageId', 'filename originalName metadata projectId');
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    res.json({
      success: true,
      data: feedback,
      message: 'Feedback updated successfully'
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback'
    });
  }
});

// DELETE /api/feedback/:id - Delete feedback
router.delete('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // TODO: Also delete associated comments when implemented
    
    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete feedback'
    });
  }
});

// GET /api/feedback/role/:role - Get feedback filtered by role
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const { imageId, projectId, status = 'open' } = req.query;
    
    let query = {
      targetRoles: { $in: [role] },
      status
    };
    
    if (imageId) {
      query.imageId = imageId;
    } else if (projectId) {
      const images = await Image.find({ projectId }, '_id');
      const imageIds = images.map(img => img._id);
      query.imageId = { $in: imageIds };
    }
    
    const feedback = await Feedback.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .populate('imageId', 'filename originalName metadata projectId');
    
    res.json({
      success: true,
      role,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching role-based feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch role-based feedback'
    });
  }
});

// GET /api/feedback/stats/:imageId - Get feedback statistics for an image
router.get('/stats/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    const stats = await Feedback.aggregate([
      { $match: { imageId: mongoose.Types.ObjectId(imageId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byCategory: {
            $push: {
              category: '$category',
              severity: '$severity',
              status: '$status'
            }
          },
          bySeverity: {
            $push: '$severity'
          },
          byStatus: {
            $push: '$status'
          }
        }
      }
    ]);
    
    // Process the aggregation results
    const result = {
      total: stats[0]?.total || 0,
      categories: {},
      severities: {},
      statuses: {}
    };
    
    if (stats[0]) {
      stats[0].byCategory.forEach(item => {
        result.categories[item.category] = (result.categories[item.category] || 0) + 1;
      });
      
      stats[0].bySeverity.forEach(severity => {
        result.severities[severity] = (result.severities[severity] || 0) + 1;
      });
      
      stats[0].byStatus.forEach(status => {
        result.statuses[status] = (result.statuses[status] || 0) + 1;
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback statistics'
    });
  }
});

// GET /api/feedback/:id/comments - Get comments for specific feedback
router.get('/:id/comments', async (req, res) => {
  try {
    const feedbackId = req.params.id;
    
    // Verify feedback exists
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // Get comments for this feedback
    const Comment = require('../models/Comment');
    const comments = await Comment.find({ feedbackId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Error fetching feedback comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback comments'
    });
  }
});

module.exports = router;
