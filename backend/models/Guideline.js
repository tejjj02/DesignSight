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
    required: true,
    enum: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js'],
    trim: true
  },
  stylingLibrary: {
    type: String,
    required: true,
    enum: ['Tailwind CSS', 'CSS Modules', 'Styled Components', 'Chakra UI', 'Sass/SCSS', 'Plain CSS'],
    trim: true
  },
  componentLibrary: {
    type: String,
    required: true,
    enum: ['shadcn/ui', 'Material UI', 'Ant Design', 'Radix UI', 'Headless UI', 'None'],
    trim: true
  },
  generatedGuidelines: {
    type: mongoose.Schema.Types.Mixed,
    default: null
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
  feedbackCount: {
    type: Number,
    default: 0
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

// Update updatedAt before saving
guidelineSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for performance
guidelineSchema.index({ imageId: 1 });
guidelineSchema.index({ projectId: 1 });
guidelineSchema.index({ createdAt: -1 });
guidelineSchema.index({ generationStatus: 1 });

module.exports = mongoose.model('Guideline', guidelineSchema);
