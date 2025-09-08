# DesignSight - Local Development Setup (Alternative to Docker)

If Docker Desktop is not available or running, you can run the project locally using Node.js directly.

## Prerequisites
- Node.js 18+ installed
- MongoDB installed locally OR MongoDB Atlas account
- Google Gemini API key

## Local Development Setup

### 1. Setup Backend
```bash
cd backend
npm install
```

Create `.env` file in backend directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017/designsight
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

Start backend:
```bash
npm run dev
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm start
```

### 3. MongoDB Setup Options

**Option A: Local MongoDB**
- Install MongoDB Community Edition
- Start MongoDB service: `mongod`
- MongoDB will be available at `mongodb://localhost:27017`

**Option B: MongoDB Atlas (Cloud)**
- Create free account at mongodb.com/atlas
- Create cluster and get connection string
- Update MONGODB_URI in .env with your Atlas connection string

### 4. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

## Docker Setup (When Available)

Once Docker Desktop is running:
```bash
# Copy environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start all services
docker-compose up --build
```

## Development Workflow

1. Start MongoDB (if local)
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm start`
4. Code and test!

Both Docker and local development approaches will work for Stage 2 development.
