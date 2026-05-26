import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { imageAPI } from '../utils/api';
import { useImageAnalysis } from '../hooks/useImageAnalysis';

function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  back:     'M19 12H5M12 5l-7 7 7 7',
  spark:    'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  plus:     'M12 5v14M5 12h14',
  close:    'M18 6 6 18M6 6l12 12',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  comment:  'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  check:    'M20 6L9 17l-5-5',
};

// ── Severity badge ─────────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const cfg = {
    high:   { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
    medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)'  },
    low:    { color: '#38bdf8', bg: 'rgba(56,189,248,0.15)'  },
  };
  const c = cfg[severity] || cfg.low;
  return (
    <span className="text-xs font-body px-2 py-0.5 rounded-full capitalize"
          style={{ color: c.color, background: c.bg }}>
      {severity}
    </span>
  );
}

// ── Score ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const radius = 36;
  const circ   = 2 * Math.PI * radius;
  const dash   = circ * (score / 100);

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute" width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="48" cy="48" r={radius} fill="none"
          stroke="url(#scoreGrad)" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 48 48)"
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10a37f" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
      <span className="relative font-heading italic text-white text-2xl">{score}</span>
    </div>
  );
}

// ── Feedback item ──────────────────────────────────────────────────────────────
function FeedbackItem({ item, index, comments, onAddComment, selected, onSelect }) {
  const [newCmt, setNewCmt] = useState('');

  const submitComment = async () => {
    if (!newCmt.trim()) return;
    await onAddComment(item._id, newCmt);
    setNewCmt('');
  };

  return (
    <div
      className="glass-card p-4 cursor-pointer transition-all duration-200"
      style={{
        borderColor: selected ? 'rgba(16,163,127,0.4)' : undefined,
        background: selected ? 'rgba(16,163,127,0.06)' : undefined,
      }}
      onClick={() => onSelect(selected ? null : item._id)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-black"
             style={{ background: item.severity === 'high' ? '#f87171' : item.severity === 'medium' ? '#fbbf24' : '#38bdf8' }}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body text-white/90 leading-tight line-clamp-2">{item.title}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2 pl-9">
        <SeverityBadge severity={item.severity} />
        <span className="text-xs font-body px-2 py-0.5 rounded-full text-white/40"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
          {item.category?.replace('_', ' ')}
        </span>
      </div>

      {/* Expanded details */}
      {selected && (
        <div className="pl-9 mt-3 space-y-3 border-t border-white/10 pt-3">
          <p className="text-xs font-body text-white/60 leading-relaxed">{item.description}</p>

          {item.recommendations?.length > 0 && (
            <div>
              <p className="text-xs font-body text-white/35 uppercase tracking-widest mb-1.5">Recommendations</p>
              <ul className="space-y-1">
                {item.recommendations.map((r, i) => (
                  <li key={i} className="text-xs font-body text-white/60 flex items-start gap-1.5">
                    <span className="text-[#10a37f] mt-0.5 flex-shrink-0"><Icon d={ICONS.check} size={10} /></span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Comments */}
          <div>
            <p className="text-xs font-body text-white/35 uppercase tracking-widest mb-1.5">
              Comments ({comments?.length || 0})
            </p>
            {comments?.length > 0 && (
              <div className="space-y-2 mb-2 max-h-28 overflow-y-auto">
                {comments.map((c, i) => (
                  <div key={i} className="text-xs font-body p-2 rounded-lg"
                       style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-white/50 font-medium">{c.author}: </span>
                    <span className="text-white/70">{c.content}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={newCmt}
                onChange={e => setNewCmt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment()}
                placeholder="Add comment…"
                className="glass-input flex-1 px-3 py-1.5 text-xs font-body"
                onClick={e => e.stopPropagation()}
              />
              <button onClick={(e) => { e.stopPropagation(); submitComment(); }}
                      className="glass-btn-accent px-3 py-1.5 text-xs"
                      style={{ borderRadius: '8px' }}>
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ImageAnalysis page ─────────────────────────────────────────────────────────
const ImageAnalysis = () => {
  const { imageId } = useParams();
  const navigate = useNavigate();

  const {
    image,
    analysis,
    loading,
    analyzing,
    error,
    roleFilter,
    setRoleFilter,
    userRole,
    setUserRole,
    selected,
    setSelected,
    showAdd,
    setShowAdd,
    newFb,
    setNewFb,
    filteredFeedback,
    comments,
    startAnalysis,
    addFeedback,
    addComment,
    downloadJSON,
    downloadPDF
  } = useImageAnalysis(imageId);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <div className="glass-card h-10 w-56 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3 glass-card h-[70vh] animate-pulse" />
          <div className="glass-card h-[70vh] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !image) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <div className="glass-panel p-8 text-center">
          <p className="text-white/60 font-body mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-primary px-6 py-2.5 text-sm">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusColor = {
    completed:  '#10a37f',
    processing: '#fbbf24',
    failed:     '#f87171',
    pending:    'rgba(255,255,255,0.4)',
  }[image?.analysisStatus] || 'rgba(255,255,255,0.4)';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <button onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 text-xs font-body text-white/40 hover:text-white/70
                             transition-colors mb-2">
            <Icon d={ICONS.back} size={12} />
            Back to Project
          </button>
          <h1 className="font-heading italic text-white text-2xl leading-none">
            {image?.originalName || 'Image Analysis'}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
            <span className="text-xs font-body capitalize" style={{ color: statusColor }}>
              {image?.analysisStatus || 'not analyzed'}
            </span>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 flex-wrap justify-end mt-1">
          {/* Role selector */}
          <select value={userRole} onChange={e => setUserRole(e.target.value)}
                  className="glass-input text-xs font-body px-3 py-2 pr-6 appearance-none cursor-pointer">
            {['designer', 'developer', 'pm', 'reviewer'].map(r => (
              <option key={r} value={r} style={{ background: '#111' }}>{r}</option>
            ))}
          </select>

          {/* Filter */}
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                  className="glass-input text-xs font-body px-3 py-2 pr-6 appearance-none cursor-pointer">
            {['all', 'designer', 'developer', 'pm', 'reviewer'].map(r => (
              <option key={r} value={r} style={{ background: '#111' }}>{r === 'all' ? 'All roles' : r}</option>
            ))}
          </select>

          <button onClick={() => setShowAdd(true)}
                  className="glass-btn px-4 py-2 text-xs flex items-center gap-1.5"
                  style={{ borderRadius: '9999px' }}>
            <Icon d={ICONS.plus} size={12} />
            Add Feedback
          </button>

          {['pending', 'failed', undefined].includes(image?.analysisStatus) && (
            <button onClick={startAnalysis} disabled={analyzing}
                    className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-40">
              <Icon d={ICONS.spark} size={12} />
              {analyzing ? 'Analyzing…' : 'Analyze with AI'}
            </button>
          )}

          <button onClick={downloadJSON}
                  className="glass-btn px-3 py-2 text-xs flex items-center gap-1"
                  style={{ borderRadius: '9999px' }}>
            <Icon d={ICONS.download} size={12} />
            JSON
          </button>
          <button onClick={downloadPDF}
                  className="glass-btn px-3 py-2 text-xs flex items-center gap-1"
                  style={{ borderRadius: '9999px' }}>
            <Icon d={ICONS.download} size={12} />
            PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card p-3 mb-4 text-xs font-body text-[#f87171]"
             style={{ borderColor: 'rgba(248,113,113,0.25)' }}>
          {error}
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 xl:h-[calc(100vh-210px)] h-auto overflow-hidden">
        {/* ── Image panel ── */}
        <div className="xl:col-span-3 glass-panel flex flex-col overflow-hidden xl:h-full xl:min-h-0" style={{ minHeight: '520px' }}>
          {/* Image header strip */}
          {image && (
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-body text-white/80">{image.originalName}</p>
                {image.metadata && (
                  <p className="text-xs font-body text-white/35">
                    {image.metadata.width}×{image.metadata.height}px ·{' '}
                    {(image.metadata.size / 1024).toFixed(0)}KB
                  </p>
                )}
              </div>
              <span className="text-xs font-body text-white/25 font-mono">
                #{image._id?.slice(-8)}
              </span>
            </div>
          )}

          {/* Image display */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-hidden relative">
            {image ? (
              <div className="relative inline-block max-w-full max-h-full h-full flex items-center justify-center">
                <div className="relative">
                  <img
                    src={imageAPI.getImageFileUrl(image._id)}
                    alt={image.originalName}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                    style={{ maxHeight: 'calc(100vh - 320px)' }}
                  />
                  {/* Feedback Overlays */}
                  {filteredFeedback.map((fb, i) => {
                    const widthPct = (fb.coordinates.width / (image.metadata?.width || 100)) * 100;
                    const heightPct = (fb.coordinates.height / (image.metadata?.height || 100)) * 100;
                    const leftPct = (fb.coordinates.x / (image.metadata?.width || 100)) * 100;
                    const topPct = (fb.coordinates.y / (image.metadata?.height || 100)) * 100;

                    const isSelected = selected === fb._id;

                    return (
                      <div
                        key={fb._id}
                        className={`absolute feedback-overlay border-2 cursor-pointer transition-all duration-300 ${isSelected ? 'shadow-[0_0_0_4px_rgba(16,163,127,0.3)] z-10' : 'opacity-60 hover:opacity-100 z-0'}`}
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          width: `${widthPct}%`,
                          height: `${heightPct}%`,
                          borderColor: fb.severity === 'high' ? '#f87171' : fb.severity === 'medium' ? '#fbbf24' : '#38bdf8',
                          background: isSelected ? 'rgba(16,163,127,0.1)' : 'transparent',
                          borderRadius: '8px'
                        }}
                        onClick={() => setSelected(isSelected ? null : fb._id)}
                      >
                        <div
                          className="absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black"
                          style={{
                            background: fb.severity === 'high' ? '#f87171' : fb.severity === 'medium' ? '#fbbf24' : '#38bdf8',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                          }}
                        >
                          {i + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-white/30 font-body text-sm">Loading image…</p>
            )}
          </div>
        </div>

        {/* ── Feedback sidebar ── */}
        <div className="xl:col-span-1 glass-panel flex flex-col overflow-hidden xl:h-full">
          {/* Score + summary */}
          {analysis?.overallAnalysis && (
            <div className="p-5 border-b border-white/10 flex items-center gap-4">
              <ScoreRing score={analysis.overallAnalysis.score} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-body text-white/40 uppercase tracking-widest mb-1">Design Score</p>
                <p className="text-xs font-body text-white/60 line-clamp-3 leading-relaxed">
                  {analysis.overallAnalysis.summary}
                </p>
              </div>
            </div>
          )}

          {/* Panel header */}
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="text-sm font-body text-white/70">
              Feedback
              <span className="ml-1.5 text-xs text-white/35">({filteredFeedback.length})</span>
            </p>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredFeedback.map((fb, i) => (
              <FeedbackItem
                key={fb._id}
                item={fb}
                index={i}
                comments={comments[fb._id]}
                onAddComment={addComment}
                selected={selected === fb._id}
                onSelect={setSelected}
              />
            ))}

            {filteredFeedback.length === 0 && (
              <div className="text-center py-10">
                <span className="text-white/20 mb-3 block"><Icon d={ICONS.comment} size={28} /></span>
                <p className="text-xs font-body text-white/35">
                  {image?.analysisStatus === 'completed'
                    ? 'No feedback for this filter'
                    : 'Run AI analysis to generate feedback'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Feedback Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel-strong w-full max-w-md p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading italic text-white text-xl">Add Feedback</h2>
              <button onClick={() => setShowAdd(false)}
                      className="text-white/35 hover:text-white transition-colors">
                <Icon d={ICONS.close} size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-body text-white/45 uppercase tracking-widest block mb-1.5">Title</label>
                <input value={newFb.title} onChange={e => setNewFb({...newFb, title: e.target.value})}
                       className="glass-input w-full px-4 py-3 text-sm font-body"
                       placeholder="e.g. Contrast ratio too low" />
              </div>
              <div>
                <label className="text-xs font-body text-white/45 uppercase tracking-widest block mb-1.5">Description</label>
                <textarea value={newFb.description} onChange={e => setNewFb({...newFb, description: e.target.value})}
                          className="glass-input w-full px-4 py-3 text-sm font-body resize-none"
                          rows={3} placeholder="Describe the issue…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-body text-white/45 uppercase tracking-widest block mb-1.5">Category</label>
                  <select value={newFb.category} onChange={e => setNewFb({...newFb, category: e.target.value})}
                          className="glass-input w-full px-3 py-2.5 text-sm font-body">
                    <option value="visual_hierarchy">Visual Hierarchy</option>
                    <option value="accessibility">Accessibility</option>
                    <option value="content">Content</option>
                    <option value="ux_patterns">UX Patterns</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-body text-white/45 uppercase tracking-widest block mb-1.5">Severity</label>
                  <select value={newFb.severity} onChange={e => setNewFb({...newFb, severity: e.target.value})}
                          className="glass-input w-full px-3 py-2.5 text-sm font-body">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="btn-secondary px-5 py-2.5 text-sm">Cancel</button>
              <button onClick={addFeedback} disabled={!newFb.title.trim()}
                      className="btn-primary px-6 py-2.5 text-sm disabled:opacity-40">
                Add Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnalysis;
