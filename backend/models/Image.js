const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  metadata: {
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    }
  },
  analysisStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  analysisResults: {
    geminiResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    processedAt: {
      type: Date,
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
imageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
imageSchema.index({ projectId: 1 });
imageSchema.index({ analysisStatus: 1 });
imageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Image', imageSchema);
