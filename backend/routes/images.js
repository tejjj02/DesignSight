const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const imagesController = require('../controllers/imagesController');

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

router.get('/', imagesController.getAllImages);
router.post('/upload', upload.single('image'), imagesController.uploadImage);
router.get('/:id', imagesController.getImage);
router.get('/:id/file', imagesController.serveImageFile);
router.put('/:id/analysis-status', imagesController.updateAnalysisStatus);
router.delete('/:id', imagesController.deleteImage);
router.post('/:id/analyze', imagesController.analyzeImage);
router.get('/:id/analysis', imagesController.getAnalysis);
router.get('/:id/download/json', imagesController.downloadJSON);
router.get('/:id/download/pdf', imagesController.downloadPDF);

module.exports = router;
