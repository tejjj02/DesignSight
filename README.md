# DesignSight - AI-Powered Design Feedback Platform

🎨 **DesignSight** is a MERN stack application that uses Google Gemini 2.0 Flash AI to analyze design screenshots and provide coordinate-anchored feedback with role-based filtering and collaborative discussions.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed
- Google Gemini API key
- Node.js 18+ (for local development)

### Setup Instructions

1. **Clone and navigate to project**
   ```bash
   cd designsight
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your `GEMINI_API_KEY`

3. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

## 📁 Project Structure

```
designsight/
├── backend/                 # Node.js Express API
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth, validation, etc.
│   ├── utils/              # Helper functions
│   └── uploads/            # Uploaded images
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
└── docker-compose.yml      # Container orchestration
```

## 🛠️ Technology Stack

**Backend:**
- Node.js + Express.js
- MongoDB with Mongoose
- Google Gemini 2.0 Flash API
- Multer for file uploads
- JWT for authentication

**Frontend:**
- React 18 with Hooks
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- Heroicons for icons

**Infrastructure:**
- Docker Compose for containerization
- MongoDB for data persistence
- CORS enabled for cross-origin requests

## 🎯 Core Features

### Stage 1: Foundation ✅
- [x] MERN stack project structure
- [x] Docker containerization
- [x] MongoDB database setup
- [x] Basic API framework
- [x] React frontend scaffold

### Stage 2: Data Models & API (Next)
- [ ] MongoDB schemas (Project, Image, Feedback, Comment)
- [ ] REST API endpoints
- [ ] File upload handling
- [ ] Database relationships

### Stage 3: AI Integration (Next)
- [ ] Gemini 2.0 Flash integration
- [ ] Structured feedback generation
- [ ] Coordinate mapping system
- [ ] Error handling & retries

### Stage 4: Interactive Frontend (Next)
- [ ] Image display with overlays
- [ ] Coordinate-anchored feedback
- [ ] Role-based filtering
- [ ] Collaborative commenting

## 🔧 Development Commands

**With Docker (Recommended):**
```bash
# Start all services
docker-compose up

# Rebuild and start
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Local Development:**
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
```

## 📊 API Endpoints (Planned)

```
POST   /api/projects              # Create project
GET    /api/projects              # List projects
POST   /api/projects/:id/upload   # Upload image
GET    /api/images/:id/analysis   # Get AI analysis
POST   /api/feedback/:id/comment  # Add comment
GET    /api/feedback/role/:role   # Filter by role
```

## 🎨 Design System

**Feedback Categories:**
- 🔴 **Accessibility** (Color contrast, readability)
- 🟡 **Visual Hierarchy** (Spacing, alignment)
- 🔵 **Content** (Copy clarity, messaging)
- 🟢 **UX Patterns** (User flow, best practices)

**User Roles:**
- **Designer** - Visual design feedback
- **Developer** - Implementation feasibility
- **PM** - Business requirements alignment
- **Reviewer** - General quality assurance

## 🚦 Current Status

**✅ Stage 1 Complete** - Project structure and Docker setup ready
- Full MERN stack foundation
- Docker containerization working
- Database initialization
- Environment configuration
- Ready for Stage 2 development

## 📝 Next Steps

1. **Stage 2**: Implement data models and API endpoints
2. **Stage 3**: Integrate Gemini 2.0 Flash for AI analysis
3. **Stage 4**: Build interactive frontend with feedback overlays
4. **Demo**: Create sample data and demo video

## 🤝 Contributing

This is a 72-hour MVP prototype. Focus areas:
- Keep it simple and functional
- Prioritize core features over polish
- Document as you build
- Test with real images

## 📄 License

MIT License - Feel free to use for your own projects!

---

**Ready to analyze designs with AI! 🎨✨**
