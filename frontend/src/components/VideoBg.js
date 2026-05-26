import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_080827_a9e5ad52-b6ee-4e79-b393-d936f179cfd7.mp4';

/**
 * Shared fixed video background with boomerang + parallax.
 * Drop this once at the top of any page — it renders fixed/z-0.
 */
export default function VideoBg({ overlay = true }) {
  const [framesReady, setFramesReady] = useState(false);
  const videoRef         = useRef(null);
  const videoBgRef       = useRef(null);
  const displayCanvasRef = useRef(null);
  const framesRef        = useRef([]);

  // ── Frame capture ────────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let capturing = true;
    let lastTime  = -1;
    const MAX_WIDTH = 960;
    const frames = [];
    let rafId = null;

    function captureFrame() {
      if (!capturing || video.readyState < 2 || video.currentTime === lastTime) return;
      lastTime = video.currentTime;
      const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
      const w = Math.round(video.videoWidth  * scale);
      const h = Math.round(video.videoHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(video, 0, 0, w, h);
      frames.push(canvas);
    }

    function startLoop() {
      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        const rvfc = () => { captureFrame(); if (capturing) video.requestVideoFrameCallback(rvfc); };
        video.requestVideoFrameCallback(rvfc);
      } else {
        const raf = () => { captureFrame(); if (capturing) rafId = requestAnimationFrame(raf); };
        rafId = requestAnimationFrame(raf);
      }
    }

    function onLoaded() { video.play().catch(() => {}); startLoop(); }
    function onEnded()  { capturing = false; framesRef.current = frames; setFramesReady(true); }

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('ended', onEnded);
    if (video.readyState >= 1) onLoaded();

    return () => {
      capturing = false;
      if (rafId) cancelAnimationFrame(rafId);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('ended', onEnded);
    };
  }, []);

  // ── Boomerang render ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!framesReady) return;
    const frames = framesRef.current;
    if (!frames.length) return;
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = frames[0].width; canvas.height = frames[0].height;

    let index = 0, direction = 1, last = performance.now();
    const interval = 1000 / 30;
    let rafId;

    function render(now) {
      rafId = requestAnimationFrame(render);
      if (now - last >= interval) {
        ctx.drawImage(frames[index], 0, 0);
        index += direction;
        if (index >= frames.length - 1) { index = frames.length - 1; direction = -1; }
        if (index <= 0)                 { index = 0;                  direction =  1; }
        last = now;
      }
    }
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [framesReady]);

  // ── Parallax mouse ───────────────────────────────────────────────────────────
  useEffect(() => {
    const strength = 20;
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0, rafId;

    function onMouseMove(e) {
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      targetX = ((e.clientX - cx) / cx) * strength;
      targetY = ((e.clientY - cy) / cy) * strength;
    }

    function loop() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      if (videoBgRef.current) gsap.set(videoBgRef.current, { x: currentX, y: currentY });
      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', onMouseMove); cancelAnimationFrame(rafId); };
  }, []);

  return (
    <div ref={videoBgRef} className="fixed top-0 left-0 w-full h-full z-0 scale-[1.08] origin-center pointer-events-none">
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted playsInline preload="auto" crossOrigin="anonymous"
        className="w-full h-full object-cover"
        style={{ display: framesReady ? 'none' : 'block' }}
      />
      <canvas
        ref={displayCanvasRef}
        className="w-full h-full object-cover"
        style={{ display: framesReady ? 'block' : 'none' }}
      />
      {/* Layered overlays: dark base + vignette */}
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
      )}
    </div>
  );
}
