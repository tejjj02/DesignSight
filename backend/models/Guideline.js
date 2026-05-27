const mongoose = require('mongoose');

const guidelineSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true
  },
  frontendStack: {
    type: String,
    enum: ['react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'vanilla'],
    required: true
  },
  stylingLibrary: {
    type: String,
    enum: ['tailwind', 'css-modules', 'styled-components', 'sass', 'bootstrap', 'chakra-ui', 'material-ui', 'vanilla-css'],
    default: 'tailwind'
  },
  componentLibrary: {
    type: String,
    enum: ['shadcn', 'headlessui', 'radix', 'mui', 'ant-design', 'chakra', 'none'],
    default: 'none'
  },
  generatedGuidelines: {
    executiveSummary: { type: String, default: '' },
    issueBreakdown: [{
      issueId: String,
      title: String,
      severity: String,
      category: String,
      description: String,
      fixImplementation: String,
      codeSnippet: String,
      priority: Number
    }],
    priorityRoadmap: [{
      phase: Number,
      label: String,
      issues: [String],
      timeEstimate: String
    }],
    accessibilityFixes: [String],
    technicalRecommendations: [String],
    generatedAt: { type: Date, default: Date.now }
  },
  pdfUrl: {
    type: String,
    default: null
  },
  generationStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: {
    type: String,
    default: null
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

guidelineSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
guidelineSchema.index({ imageId: 1 });
guidelineSchema.index({ projectId: 1 });
guidelineSchema.index({ createdAt: -1 });
guidelineSchema.index({ generationStatus: 1 });

module.exports = mongoose.model('Guideline', guidelineSchema);
