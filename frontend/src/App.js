import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages (to be created)
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import ImageAnalysis from './pages/ImageAnalysis';

function App() {
  return (
    <Router>
      <div className="App min-h-screen" style={{backgroundColor: 'var(--primary-bg)'}}>
        <header className="shadow-accent border-b" style={{backgroundColor: 'var(--secondary-bg)', borderColor: 'var(--border-color)'}}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold gradient-text">
                  DesignSight
                </h1>
                <span className="ml-2 px-2 py-1 text-xs rounded text-white" style={{backgroundColor: 'var(--accent-bg)'}}>
                  AI-Powered
                </span>
              </div>
              <nav className="flex space-x-4">
                <a href="/" className="hover:opacity-75 transition-opacity text-accent">
                  Dashboard
                </a>
                <a href="/projects" className="hover:opacity-75 transition-opacity text-accent">
                  Projects
                </a>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/images/:imageId/analysis" element={<ImageAnalysis />} />
          </Routes>
        </main>

        <footer className="border-t mt-12" style={{backgroundColor: 'var(--secondary-bg)', borderColor: 'var(--border-color)'}}>
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center" style={{color: 'var(--text-secondary)'}}>
              DesignSight - AI-Powered Design Feedback Platform
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
