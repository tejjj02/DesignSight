import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';

// ─── Constants ───────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Projects', href: '/projects' }
];

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_080827_a9e5ad52-b6ee-4e79-b393-d936f179cfd7.mp4';

// ─── LogoMark ────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <svg width="44" height="26" viewBox="0 0 44 26" fill="none" aria-label="DesignSight logo">
      <rect x="0"  y="3" width="14" height="20" rx="3" fill="white" />
      <rect x="16" y="3" width="12" height="20" rx="3" fill="white" />
      <rect x="30" y="3" width="14" height="20" rx="3" fill="white" />
    </svg>
  );
}

// ─── HeroSection Component ───────────────────────────────────────────────────
export default function HeroSection() {
  const navigate = useNavigate();
  const [mounted, setMounted]       = useState(false);
  const [framesReady, setFramesReady] = useState(false);

  const videoRef        = useRef(null);   // <video>
  const videoBgRef      = useRef(null);   // parallax wrapper div
  const displayCanvasRef = useRef(null);  // boomerang canvas
  const framesRef       = useRef([]);     // captured frames array

  // ── Mount fade-in ──────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Effect 1: Frame capture (boomerang setup) ──────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let capturing = true;
    let lastTime  = -1;
    const MAX_WIDTH = 960;
    const frames = [];
    let rafId = null;

    function captureFrame() {
      if (!capturing)             return;
      if (video.readyState < 2)   return;
      if (video.currentTime === lastTime) return;

      lastTime = video.currentTime;

      const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
      const w = Math.round(video.videoWidth  * scale);
      const h = Math.round(video.videoHeight * scale);

      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, w, h);
      frames.push(canvas);
    }

    function startLoop() {
      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        const rvfc = () => {
          captureFrame();
          if (capturing) video.requestVideoFrameCallback(rvfc);
        };
        video.requestVideoFrameCallback(rvfc);
      } else {
        const raf = () => {
          captureFrame();
          if (capturing) rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);
      }
    }

    function onLoaded() {
      video.play().catch(() => {});
      startLoop();
    }

    function onEnded() {
      capturing = false;
      framesRef.current = frames;
      setFramesReady(true);
    }

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('ended', onEnded);

    if (video.readyState >= 1) {
      onLoaded();
    }

    return () => {
      capturing = false;
      if (rafId) cancelAnimationFrame(rafId);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('ended', onEnded);
    };
  }, []);

  // ── Effect 2: Boomerang render ─────────────────────────────────────────────
  useEffect(() => {
    if (!framesReady) return;
    const frames = framesRef.current;
    if (!frames.length) return;

    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width  = frames[0].width;
    canvas.height = frames[0].height;

    let index     = 0;
    let direction = 1;
    let last      = performance.now();
    const interval = 1000 / 30;
    let rafId;

    function render(now) {
      rafId = requestAnimationFrame(render);
      if (now - last >= interval) {
        ctx.drawImage(frames[index], 0, 0);
        index += direction;

        if (index >= frames.length - 1) {
          index     = frames.length - 1;
          direction = -1;
        }
        if (index <= 0) {
          index     = 0;
          direction = 1;
        }
        last = now;
      }
    }

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [framesReady]);

  // ── Effect 3: Parallax mouse tracking (gsap) ───────────────────────────────
  useEffect(() => {
    const strength = 20;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let rafId;

    function onMouseMove(e) {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      targetX = ((e.clientX - cx) / cx) * strength;
      targetY = ((e.clientY - cy) / cy) * strength;
    }

    function loop() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      if (videoBgRef.current) {
        gsap.set(videoBgRef.current, { x: currentX, y: currentY });
      }
      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white font-body overflow-x-hidden">

      {/* ── Video background layer ── */}
      <div
        ref={videoBgRef}
        className="fixed top-0 left-0 w-full h-full z-0 scale-[1.08] origin-center"
      >
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          style={{ display: framesReady ? 'none' : 'block' }}
        />
        <canvas
          ref={displayCanvasRef}
          className="w-full h-full object-cover"
          style={{ display: framesReady ? 'block' : 'none' }}
        />

        {/* Subtle dark gradient overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />
      </div>

      {/* ── Hero title ── */}
      <div
        className={`fixed left-0 right-0 z-20 w-full px-4 transition-all duration-1000 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
        style={{ top: '126px' }}
      >
        <h1 className="hero-title select-none">DesignSight</h1>
        {/* AI badge beneath title */}
        <p
          className={`text-center font-body font-light text-white/50 text-sm tracking-[0.25em] uppercase mt-4 transition-all duration-1000 delay-150 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          AI-Powered Design Feedback
        </p>
      </div>

      {/* ── Nav ── */}
      <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap">
        <div className="liquid-glass flex items-center gap-6 rounded px-4 py-2.5">
          <LogoMark />

          <div className="flex items-center gap-5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(link.href);
                }}
                className="text-sm font-body font-light text-white/70 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Bottom row ── */}
      <div
        className={`fixed bottom-12 left-0 right-0 px-10 flex items-end justify-between z-20 transition-all duration-1000 delay-300 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Left descriptor */}
        <p className="text-sm font-body font-light text-white/75 max-w-[220px] leading-relaxed">
          DesignSight's AI understands context, composition, and style like a creative director would.
        </p>

        {/* Center CTAs */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center gap-3">
          {/* Primary CTA */}
          <button
            id="hero-cta-primary"
            onClick={() => navigate('/dashboard')}
            className="group relative bg-white text-black text-sm font-body font-medium rounded px-6 py-3 overflow-hidden active:scale-[0.97] transition-all duration-200 shadow-[0_0_0_0_rgba(255,255,255,0)] hover:shadow-[0_0_24px_4px_rgba(255,255,255,0.25)] hover:scale-[1.03]"
          >
            <span className="relative z-10">Start analyzing</span>
            <span className="absolute inset-0 bg-gradient-to-b from-white to-white/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>

          {/* Secondary CTA */}
          <button
            id="hero-cta-secondary"
            onClick={() => navigate('/projects')}
            className="liquid-glass group text-white text-sm font-body font-medium rounded px-6 py-3 active:scale-[0.97] transition-all duration-200 hover:scale-[1.03] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_20px_2px_rgba(255,255,255,0.07)]"
          >
            See projects
          </button>
        </div>

        {/* Right descriptor */}
        <p className="text-sm font-body font-light text-white/75 max-w-[220px] leading-relaxed text-right">
          Describe what you see in your designs — get actionable feedback that actually helps.
        </p>
      </div>
    </div>
  );
}
