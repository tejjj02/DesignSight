import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

// Pages
import Dashboard     from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import ImageAnalysis from './pages/ImageAnalysis';

// Components
import HeroSection from './components/HeroSection';
import VideoBg     from './components/VideoBg';

// ─── Logo mark ────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <svg width="36" height="22" viewBox="0 0 44 26" fill="none" aria-hidden>
      <rect x="0"  y="3" width="14" height="20" rx="3" fill="white" />
      <rect x="16" y="3" width="12" height="20" rx="3" fill="white" />
      <rect x="30" y="3" width="14" height="20" rx="3" fill="white" />
    </svg>
  );
}

// ─── Glass App Nav (fixed top bar for inner pages) ────────────────────────────
function AppNav() {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap">
      <div className="liquid-glass flex items-center gap-5 px-4 py-2.5"
           style={{ borderRadius: '9999px' }}>
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-sm font-heading font-medium text-white/90 italic tracking-wide">
            DesignSight
          </span>
        </Link>

        <div className="w-px h-4 bg-white/20 mx-1" />

        <div className="flex items-center gap-4">
          {[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Projects',  href: '/projects'  },
          ].map(({ label, href }) => (
            <Link key={label} to={href}
               className="text-sm font-body font-light text-white/65 hover:text-white transition-colors duration-200">
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 ml-2">
          <button
            onClick={() => navigate('/projects')}
            className="liquid-glass-strong text-sm font-body font-medium text-white px-4 py-1.5
                       transition-all duration-200 hover:scale-[1.04]
                       hover:shadow-[0_0_16px_2px_rgba(255,255,255,0.12)] active:scale-[0.97]"
            style={{ borderRadius: '9999px' }}>
            New Project
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Shared inner-page shell ──────────────────────────────────────────────────
function AppShell({ children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-black text-white font-body overflow-x-hidden">
      {/* Persistent video background */}
      <VideoBg />

      {/* Floating nav */}
      <AppNav />

      {/* Page content sits on top of video, padded for nav */}
      <main className="relative z-10 pt-24 pb-12 min-h-screen">
        <div key={location.pathname} className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Subtle footer */}
      <footer className="relative z-10 border-t border-white/10 py-4">
        <p className="text-center text-xs font-body text-white/30 tracking-widest uppercase">
          DesignSight — AI-Powered Design Feedback
        </p>
      </footer>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<HeroSection />} />

        {/* Dashboard / Projects list */}
        <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />
        <Route path="/projects"  element={<AppShell><Dashboard /></AppShell>} />

        {/* Project detail */}
        <Route path="/projects/:id" element={<AppShell><ProjectDetail /></AppShell>} />

        {/* Image analysis */}
        <Route path="/images/:imageId/analysis" element={<AppShell><ImageAnalysis /></AppShell>} />
      </Routes>
    </Router>
  );
}

export default App;
