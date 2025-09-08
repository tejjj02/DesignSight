const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  feedbackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
    required: true
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  author: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['designer', 'developer', 'pm', 'reviewer', 'stakeholder'],
      required: true
    },
    avatar: {
      type: String,
      default: null
    }
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  mentions: [{
    userId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  }],
  attachments: [{
    filename: String,
    url: String,
    type: {
      type: String,
      enum: ['image', 'document', 'link']
    }
  }],
  reactions: [{
    type: {
      type: String,
      enum: ['like', 'love', 'thumbs_up', 'thumbs_down', 'laugh', 'sad']
    },
    author: {
      name: String,
      role: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'edited', 'deleted'],
    default: 'active'
  },
  editHistory: [{
    previousContent: String,
    editedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
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
commentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
commentSchema.index({ feedbackId: 1 });
commentSchema.index({ parentCommentId: 1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ 'author.role': 1 });

// Virtual for getting nested replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentCommentId'
});

// Method to get comment thread depth
commentSchema.methods.getThreadDepth = async function() {
  let depth = 0;
  let current = this;
  
  while (current.parentCommentId) {
    depth++;
    current = await this.constructor.findById(current.parentCommentId);
    if (!current) break;
  }
  
  return depth;
};

// Static method to get comment tree for a feedback
commentSchema.statics.getCommentTree = async function(feedbackId) {
  const comments = await this.find({ feedbackId })
    .sort({ createdAt: 1 })
    .lean();
  
  // Build tree structure
  const commentMap = {};
  const rootComments = [];
  
  comments.forEach(comment => {
    commentMap[comment._id] = { ...comment, replies: [] };
  });
  
  comments.forEach(comment => {
    if (comment.parentCommentId && commentMap[comment.parentCommentId]) {
      commentMap[comment.parentCommentId].replies.push(commentMap[comment._id]);
    } else {
      rootComments.push(commentMap[comment._id]);
    }
  });
  
  return rootComments;
};

module.exports = mongoose.model('Comment', commentSchema);
