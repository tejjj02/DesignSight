const Comment = require('../models/Comment');
const Feedback = require('../models/Feedback');

exports.getComments = async (req, res) => {
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
};

exports.getCommentThread = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
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
};

exports.createComment = async (req, res) => {
  try {
    const {
      feedbackId,
      parentCommentId,
      author,
      content,
      mentions,
      attachments
    } = req.body;
    
    if (!feedbackId || !author || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: feedbackId, author, content'
      });
    }
    
    if (!author.name || !author.role) {
      return res.status(400).json({
        success: false,
        error: 'Author must have name and role'
      });
    }
    
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          error: 'Parent comment not found'
        });
      }
      
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
};

exports.getCommentById = async (req, res) => {
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
};

exports.updateComment = async (req, res) => {
  try {
    const { content, mentions, attachments } = req.body;
    
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }
    
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
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }
    
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
};

exports.addReaction = async (req, res) => {
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
    
    const existingReaction = comment.reactions.find(
      reaction => reaction.author.name === author.name
    );
    
    if (existingReaction) {
      existingReaction.type = type;
      existingReaction.createdAt = Date.now();
    } else {
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
};

exports.removeReaction = async (req, res) => {
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
};

exports.getReplies = async (req, res) => {
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
};
