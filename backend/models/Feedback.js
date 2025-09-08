const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true
  },
  category: {
    type: String,
    enum: ['accessibility', 'visual_hierarchy', 'content', 'ux_patterns'],
    required: true
  },
  severity: {
    type: String,
    enum: ['high', 'medium', 'low'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  coordinates: {
    x: {
      type: Number,
      required: true,
      min: 0
    },
    y: {
      type: Number,
      required: true,
      min: 0
    },
    width: {
      type: Number,
      required: true,
      min: 1
    },
    height: {
      type: Number,
      required: true,
      min: 1
    }
  },
  targetRoles: [{
    type: String,
    enum: ['designer', 'developer', 'pm', 'reviewer'],
    required: true
  }],
  recommendations: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'dismissed'],
    default: 'open'
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  }
});

// Update the updatedAt field before saving
feedbackSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set resolvedAt when status changes to resolved
  if (this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = Date.now();
  }
  
  next();
});

// Indexes for better query performance
feedbackSchema.index({ imageId: 1 });
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ severity: 1 });
feedbackSchema.index({ targetRoles: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ createdAt: -1 });

// Virtual for getting comments count
feedbackSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'feedbackId',
  count: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);
