const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Feedback = require('../models/Feedback');

// GET /api/comments - Get comments with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      feedbackId, 
      parentCommentId, 
      authorRole,
      limit = 50,
      page = 1 
    } = req.query;
    
    let query = { status: 'active' };
    
    if (feedbackId) query.feedbackId = feedbackId;
    if (parentCommentId) query.parentCommentId = parentCommentId;
    if (authorRole) query['author.role'] = authorRole;
    
    const skip = (page - 1) * limit;
    
    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('feedbackId', 'title category severity')
      .populate('parentCommentId', 'content author.name');
    
    const total = await Comment.countDocuments(query);
    
    res.json({
      success: true,
      count: comments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
});

// GET /api/comments/thread/:feedbackId - Get comment tree for feedback
router.get('/thread/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;
    
    // Verify feedback exists
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // Get comment tree using the static method
    const commentTree = await Comment.getCommentTree(feedbackId);
    
    res.json({
      success: true,
      feedbackId,
      count: commentTree.length,
      data: commentTree
    });
  } catch (error) {
    console.error('Error fetching comment thread:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comment thread'
    });
  }
});

// POST /api/comments - Create new comment
router.post('/', async (req, res) => {
  try {
    const {
      feedbackId,
      parentCommentId,
      author,
      content,
      mentions,
      attachments
    } = req.body;
    
    // Validate required fields
    if (!feedbackId || !author || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: feedbackId, author, content'
      });
    }
    
    // Validate author object
    if (!author.name || !author.role) {
      return res.status(400).json({
        success: false,
        error: 'Author must have name and role'
      });
    }
    
    // Verify feedback exists
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // If replying to a comment, verify parent exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          error: 'Parent comment not found'
        });
      }
      
      // Ensure parent comment belongs to the same feedback
      if (parentComment.feedbackId.toString() !== feedbackId) {
        return res.status(400).json({
          success: false,
          error: 'Parent comment does not belong to the specified feedback'
        });
      }
    }
    
    const comment = new Comment({
      feedbackId,
      parentCommentId: parentCommentId || null,
      author,
      content,
      mentions: mentions || [],
      attachments: attachments || []
    });
    
    await comment.save();
    
    // Populate the response
    await comment.populate('feedbackId', 'title category severity');
    if (parentCommentId) {
      await comment.populate('parentCommentId', 'content author.name');
    }
    
    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment created successfully'
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
});

// GET /api/comments/:id - Get specific comment
router.get('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('feedbackId', 'title category severity')
      .populate('parentCommentId', 'content author.name')
      .populate('replies');
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }
    
    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comment'
    });
  }
});

// PUT /api/comments/:id - Update comment
router.put('/:id', async (req, res) => {
  try {
    const { content, mentions, attachments } = req.body;
    
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }
    
    // Store edit history
    if (content && content !== comment.content) {
      comment.editHistory.push({
        previousContent: comment.content,
        editedAt: Date.now(),
        reason: 'Content updated'
      });
      comment.content = content;
      comment.status = 'edited';
    }
    
    if (mentions) comment.mentions = mentions;
    if (attachments) comment.attachments = attachments;
    
    comment.updatedAt = Date.now();
    
    await comment.save();
    
    res.json({
      success: true,
      data: comment,
      message: 'Comment updated successfully'
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update comment'
    });
  }
});

// DELETE /api/comments/:id - Soft delete comment
router.delete('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }
    
    // Soft delete - mark as deleted instead of removing
    comment.status = 'deleted';
    comment.content = '[This comment has been deleted]';
    comment.updatedAt = Date.now();
    
    await comment.save();
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

// POST /api/comments/:id/reaction - Add reaction to comment
router.post('/:id/reaction', async (req, res) => {
  try {
    const { type, author } = req.body;
    
    if (!type || !author) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, author'
      });
    }
    
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }
    
    // Check if user already reacted
    const existingReaction = comment.reactions.find(
      reaction => reaction.author.name === author.name
    );
    
    if (existingReaction) {
      // Update existing reaction
      existingReaction.type = type;
      existingReaction.createdAt = Date.now();
    } else {
      // Add new reaction
      comment.reactions.push({
        type,
        author,
        createdAt: Date.now()
      });
    }
    
    comment.updatedAt = Date.now();
    await comment.save();
    
    res.json({
      success: true,
      data: comment,
      message: 'Reaction added successfully'
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add reaction'
    });
  }
});

// DELETE /api/comments/:id/reaction - Remove reaction from comment
router.delete('/:id/reaction', async (req, res) => {
  try {
    const { authorName } = req.body;
    
    if (!authorName) {
      return res.status(400).json({
        success: false,
        error: 'Author name is required'
      });
    }
    
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }
    
    // Remove reaction
    comment.reactions = comment.reactions.filter(
      reaction => reaction.author.name !== authorName
    );
    
    comment.updatedAt = Date.now();
    await comment.save();
    
    res.json({
      success: true,
      data: comment,
      message: 'Reaction removed successfully'
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove reaction'
    });
  }
});

// GET /api/comments/:id/replies - Get direct replies to a comment
router.get('/:id/replies', async (req, res) => {
  try {
    const replies = await Comment.find({ 
      parentCommentId: req.params.id,
      status: 'active'
    })
    .sort({ createdAt: 1 })
    .populate('author');
    
    res.json({
      success: true,
      count: replies.length,
      data: replies
    });
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch replies'
    });
  }
});

module.exports = router;
