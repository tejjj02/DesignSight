# 🏗️ DesignSight Technical Architecture

## 🔄 **System Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (Port 3000)                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │  Dashboard  │ │ ProjectView │ │ImageAnalysis│              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│            │              │              │                     │
│            └──────────────┼──────────────┘                     │
│                          │                                     │
│                    Axios HTTP Client                           │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                    REST API Calls
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                   APPLICATION LAYER                            │
├─────────────────────────┼───────────────────────────────────────┤
│  Express.js Backend (Port 5000)                               │
│                         │                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │   Routes    │ │ Controllers │ │ Middleware  │              │
│  │             │ │             │ │   - CORS    │              │
│  │ /projects   │ │ Project     │ │   - Multer  │              │
│  │ /images     │ │ Image       │ │   - Auth    │              │
│  │ /feedback   │ │ Feedback    │ │   - Error   │              │
│  │ /comments   │ │ Comment     │ │             │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│         │                │              │                     │
│         └────────────────┼──────────────┘                     │
│                          │                                     │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                    Database Queries
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                    DATA LAYER                                  │
├─────────────────────────┼───────────────────────────────────────┤
│  MongoDB (Port 27017)   │                                      │
│                         │                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │  Projects   │ │   Images    │ │  Feedback   │              │
│  │ Collection  │ │ Collection  │ │ Collection  │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                │
│  ┌─────────────┐ ┌─────────────┐                              │
│  │  Comments   │ │ File System │                              │
│  │ Collection  │ │  /uploads   │                              │
│  └─────────────┘ └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────┐                      │
│  │        Google Gemini AI             │                      │
│  │                                     │                      │
│  │  ┌─────────────┐ ┌─────────────┐   │                      │
│  │  │   Vision    │ │  Language   │   │                      │
│  │  │ Processing  │ │  Analysis   │   │                      │
│  │  └─────────────┘ └─────────────┘   │                      │
│  │           │              │         │                      │
│  │           └──────┬───────┘         │                      │
│  │                  │                 │                      │
│  │        ┌─────────────┐             │                      │
│  │        │  Feedback   │             │                      │
│  │        │ Generation  │             │                      │
│  │        └─────────────┘             │                      │
│  └─────────────────────────────────────┘                      │
│                     ▲                                         │
│                     │                                         │
│              API Calls (HTTPS)                               │
│                     │                                         │
└─────────────────────┼─────────────────────────────────────────┘
                      │
              Backend Service Layer
```

## 🔄 **Data Flow Sequence**

### **Image Upload & Analysis Flow:**

```
User          Frontend       Backend        Database       Google AI
 │               │              │              │              │
 │  Upload Image │              │              │              │
 ├──────────────►│              │              │              │
 │               │  POST /upload │              │              │
 │               ├─────────────►│              │              │
 │               │              │ Save Image   │              │
 │               │              ├─────────────►│              │
 │               │              │              │              │
 │               │              │ Image Record │              │
 │               │              │◄─────────────┤              │
 │               │ Image ID     │              │              │
 │               │◄─────────────┤              │              │
 │ Success       │              │              │              │
 │◄──────────────┤              │              │              │
 │               │              │              │              │
 │  Start Analysis              │              │              │
 ├──────────────►│              │              │              │
 │               │ POST /analyze │              │              │
 │               ├─────────────►│              │              │
 │               │              │ Get Image    │              │
 │               │              ├─────────────►│              │
 │               │              │ Image Data   │              │
 │               │              │◄─────────────┤              │
 │               │              │              │ Analyze Image│
 │               │              ├─────────────────────────────►│
 │               │              │              │              │
 │               │              │              │ AI Feedback  │
 │               │              │◄─────────────────────────────┤
 │               │              │ Save Feedback│              │
 │               │              ├─────────────►│              │
 │               │ Analysis Complete           │              │
 │               │◄─────────────┤              │              │
 │ Results       │              │              │              │
 │◄──────────────┤              │              │              │
```

## 🏗️ **Component Architecture**

### **Frontend Components:**

```
App.js
├── Router Configuration
├── Global State Management
└── Main Layout
    │
    ├── Dashboard Component
    │   ├── Project List
    │   ├── Create Project Modal
    │   └── Recent Activity
    │
    ├── Project Detail Component
    │   ├── Project Header
    │   ├── Image Gallery
    │   ├── Upload Section
    │   └── Statistics Panel
    │
    └── Image Analysis Component
        ├── Header Controls
        │   ├── Role Selector
        │   ├── Filter Options
        │   └── Export Buttons
        │
        ├── Main Content
        │   ├── Image Viewer
        │   │   ├── Zoom Controls
        │   │   ├── Feedback Overlays
        │   │   └── Coordinate Display
        │   │
        │   └── Feedback Panel
        │       ├── AI Analysis Summary
        │       ├── Feedback List
        │       │   ├── Feedback Item
        │       │   │   ├── Title & Description
        │       │   │   ├── Severity Badge
        │       │   │   ├── Category Tag
        │       │   │   ├── Recommendations
        │       │   │   └── Comments Section
        │       │   │       ├── Comment List
        │       │   │       └── Add Comment Form
        │       │   └── ...more feedback items
        │       │
        │       └── Add Feedback Form
        │
        └── Modal Components
            ├── Add Feedback Modal
            └── Export Options Modal
```

### **Backend Services:**

```
Express Server
├── Route Handlers
│   ├── Project Routes (/api/projects)
│   ├── Image Routes (/api/images)
│   ├── Feedback Routes (/api/feedback)
│   └── Comment Routes (/api/comments)
│
├── Controllers
│   ├── ProjectController
│   ├── ImageController
│   ├── FeedbackController
│   └── CommentController
│
├── Services
│   ├── GeminiService (AI Integration)
│   ├── ImageService (File Processing)
│   ├── FeedbackService (Business Logic)
│   └── ExportService (PDF/JSON)
│
├── Models (Mongoose Schemas)
│   ├── Project.js
│   ├── Image.js
│   ├── Feedback.js
│   └── Comment.js
│
├── Middleware
│   ├── CORS Configuration
│   ├── Multer (File Upload)
│   ├── Error Handler
│   └── Request Validation
│
└── Utils
    ├── Database Connection
    ├── File System Helpers
    └── Response Formatters
```

## 🔧 **Technology Integration Points**

### **React ↔ Express API:**
```javascript
// Frontend API calls
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Usage in components
const uploadImage = async (formData) => {
  const response = await api.post('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
```

### **Express ↔ MongoDB:**
```javascript
// Mongoose model definition
const imageSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  filename: String,
  analysisStatus: { type: String, enum: ['pending', 'processing', 'completed'] }
});

// Controller usage
const image = await Image.findById(imageId).populate('feedback');
```

### **Backend ↔ Google AI:**
```javascript
// Gemini service integration
const geminiService = new GeminiService(process.env.GEMINI_API_KEY);

const analyzeImage = async (imageBuffer, options) => {
  const result = await geminiService.analyzeDesign(imageBuffer, {
    role: options.role,
    focusAreas: options.focusAreas
  });
  return result;
};
```

## 📊 **Performance Optimization**

### **Frontend Optimizations:**
- **Code Splitting**: Route-based component loading
- **Image Optimization**: Lazy loading and compression
- **Caching**: API response caching with Axios
- **State Management**: Optimized re-renders with React hooks

### **Backend Optimizations:**
- **Database Indexing**: MongoDB indexes on frequently queried fields
- **Connection Pooling**: MongoDB connection optimization
- **File Streaming**: Efficient image serving
- **Error Handling**: Graceful degradation

### **AI Service Optimizations:**
- **Request Batching**: Multiple images in single analysis
- **Caching**: Store common analysis patterns
- **Timeout Handling**: Graceful AI service failures
- **Rate Limiting**: Prevent API quota exhaustion

This architecture provides a robust, scalable foundation for AI-powered design feedback with clear separation of concerns and efficient data flow.
