import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, imageAPI } from '../utils/api';

function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  back:    'M19 12H5M12 5l-7 7 7 7',
  upload:  'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  image:   'M21 15l-5-5L5 20M3 3h18v18H3zM8.5 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  spark:   'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  eye:     'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  pending: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
};

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = {
    completed: { color: '#10a37f', bg: 'rgba(16,163,127,0.15)', label: 'Analyzed' },
    processing: { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', label: 'Processing…' },
    failed:     { color: '#f87171', bg: 'rgba(248,113,113,0.15)', label: 'Failed' },
    pending:    { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.08)', label: 'Pending' },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span className="text-xs font-body px-2.5 py-1 rounded-full"
          style={{ color: c.color, background: c.bg }}>
      {c.label}
    </span>
  );
}

// ── Image card ────────────────────────────────────────────────────────────────
function ImageCard({ image, index, onAnalyze, isAnalyzing }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const status = isAnalyzing ? 'processing' : (image.analysisStatus || 'pending');

  return (
    <div className="glass-card overflow-hidden group">
      {/* Image preview area */}
      <div className="relative h-44 flex items-center justify-center"
           style={{ background: 'rgba(255,255,255,0.03)' }}>
        {!imgError ? (
          <img
            src={imageAPI.getImageFileUrl(image._id)}
            alt={image.originalName}
            className={`w-full h-full object-cover transition-transform duration-500 ${status === 'processing' ? 'blur-[2px] scale-100' : 'group-hover:scale-105'}`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/25">
            <Icon d={ICONS.image} size={32} />
            <span className="text-xs font-body">Preview unavailable</span>
          </div>
        )}
        
        {status === 'processing' ? (
          /* Pipeline status visual overlay */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-[2px] animate-fade-in">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-[#10a37f] animate-spin" />
              <span className="text-[11px] font-heading font-medium tracking-[0.15em] uppercase text-white/90">Analyzing Design</span>
            </div>
            
            <div className="w-4/5 space-y-2">
              <div className="relative h-[3px] bg-white/10 rounded-full overflow-hidden">
                <div className="animate-pipeline-load rounded-full" />
              </div>
              <div className="flex justify-between text-[9px] font-body text-white/40 tracking-wider">
                <span>Reading layout...</span>
                <span className="animate-pulse">Gemini 2.0 Vision</span>
              </div>
            </div>
          </div>
        ) : (
          /* Hover overlay */
          <div className="absolute inset-0 flex items-center justify-center gap-2
                          opacity-0 group-hover:opacity-100 transition-opacity duration-200"
               style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <button
              onClick={() => navigate(`/images/${image._id}/analysis`)}
              className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5"
            >
              <Icon d={ICONS.eye} size={12} />
              View
            </button>
            {(status === 'pending' || status === 'failed') && (
              <button
                onClick={() => onAnalyze(image._id)}
                className="glass-btn px-4 py-2 text-xs flex items-center gap-1.5"
                style={{ borderRadius: '9999px' }}
              >
                <Icon d={ICONS.spark} size={12} />
                Analyze
              </button>
            )}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-body text-white/85 leading-tight line-clamp-1">
            {image.originalName || `Image ${index + 1}`}
          </p>
          <StatusPill status={status} />
        </div>
        {image.metadata && (
          <p className="text-xs font-body text-white/35">
            {image.metadata.width}×{image.metadata.height}px
          </p>
        )}
      </div>
    </div>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ projectId, onClose, onUploaded }) {
  const [file, setFile]     = useState(null);
  const [busy, setBusy]     = useState(false);
  const [drag, setDrag]     = useState(false);

  const handleFile = (f) => {
    if (f && f.type.startsWith('image/')) setFile(f);
    else alert('Please select an image file');
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('projectId', projectId);
    await imageAPI.uploadImage(fd);
    onUploaded();
    onClose();
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-panel-strong w-full max-w-md p-7">
        <h2 className="font-heading italic text-white text-2xl mb-1">Upload Design</h2>
        <p className="text-xs font-body text-white/45 mb-6">
          Upload a design image to get AI-powered feedback.
        </p>

        {/* Drop zone */}
        <div
          className="glass-card p-8 text-center cursor-pointer transition-all duration-200 mb-5"
          style={{
            borderRadius: '16px',
            borderColor: drag ? 'rgba(16,163,127,0.5)' : 'rgba(255,255,255,0.12)',
            background: drag ? 'rgba(16,163,127,0.06)' : undefined,
          }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input-upload').click()}
        >
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[#10a37f]"><Icon d={ICONS.upload} size={28} /></span>
              <p className="text-sm font-body text-white/80">{file.name}</p>
              <p className="text-xs font-body text-white/40">Click to change</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-white/25"><Icon d={ICONS.upload} size={28} /></span>
              <p className="text-sm font-body text-white/60">Drop image here or click to browse</p>
              <p className="text-xs font-body text-white/30">PNG, JPG, WEBP up to 50MB</p>
            </div>
          )}
        </div>

        <input id="file-input-upload" type="file" accept="image/*" className="hidden"
               onChange={e => handleFile(e.target.files[0])} />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={submit} disabled={!file || busy}
                  className="btn-primary px-6 py-2.5 text-sm disabled:opacity-40">
            {busy ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProjectDetail page ────────────────────────────────────────────────────────
const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project,  setProject]  = useState(null);
  const [images,   setImages]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState({});

  useEffect(() => {
    fetchProject();
    fetchImages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await projectAPI.getProject(id);
      setProject(res.data);
    } catch {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const data = await imageAPI.getAllImages({ projectId: id });
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching images:', err);
    }
  };

  const handleAnalyze = async (imageId) => {
    try {
      setAnalyzingIds(prev => ({ ...prev, [imageId]: true }));
      // Optimistically update status to show running pipeline immediately
      setImages(prev => prev.map(img => img._id === imageId ? { ...img, analysisStatus: 'processing' } : img));
      
      await imageAPI.analyzeImage(imageId, {
        role: 'designer',
        focusAreas: ['layout', 'typography', 'color'],
        projectType: 'web-design',
      });
      await fetchImages();
    } catch (err) {
      console.error('Analysis failed:', err);
      // Revert status to failed
      setImages(prev => prev.map(img => img._id === imageId ? { ...img, analysisStatus: 'failed' } : img));
    } finally {
      setAnalyzingIds(prev => {
        const next = { ...prev };
        delete next[imageId];
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6">
        <div className="glass-card h-12 w-48 mb-8 animate-pulse" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => <div key={i} className="stats-card h-24 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="glass-card h-52 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-6xl mx-auto px-6">
        <div className="glass-panel p-8 text-center">
          <p className="text-white/60 font-body mb-4">{error || 'Project not found'}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary px-6 py-2.5 text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const analyzedCount = images.filter(i => i.analysisStatus === 'completed').length;

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-body text-white/40 hover:text-white/70
                       transition-colors mb-3"
          >
            <Icon d={ICONS.back} size={12} />
            All Projects
          </button>
          <h1 className="font-heading italic text-white text-4xl leading-none mb-1">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-sm font-body text-white/45 mt-2 max-w-lg">{project.description}</p>
          )}
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 mt-2"
        >
          <Icon d={ICONS.upload} size={14} />
          Upload Image
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stats-card p-5">
          <p className="text-xs font-body text-white/40 uppercase tracking-widest mb-1">Total Images</p>
          <p className="text-3xl font-heading italic gradient-text">{images.length}</p>
        </div>
        <div className="stats-card p-5">
          <p className="text-xs font-body text-white/40 uppercase tracking-widest mb-1">Analyzed</p>
          <p className="text-3xl font-heading italic text-white">{analyzedCount}</p>
        </div>
        <div className="stats-card p-5">
          <p className="text-xs font-body text-white/40 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-3xl font-heading italic text-white">{images.length - analyzedCount}</p>
        </div>
      </div>

      {/* Images grid */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading italic text-white text-xl">Design Files</h2>
          {images.length > 0 && (
            <span className="text-xs font-body text-white/35">{images.length} file{images.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {images.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-white/25"><Icon d={ICONS.image} size={24} /></span>
            </div>
            <h3 className="font-heading italic text-white text-lg mb-2">No images yet</h3>
            <p className="text-sm font-body text-white/40 max-w-xs mb-6 leading-relaxed">
              Upload your first design image to start getting instant AI feedback.
            </p>
            <button onClick={() => setShowUpload(true)} className="btn-primary px-6 py-2.5 text-sm">
              Upload Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img, i) => (
              <ImageCard
                key={img._id}
                image={img}
                index={i}
                onAnalyze={handleAnalyze}
                isAnalyzing={!!analyzingIds[img._id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          projectId={id}
          onClose={() => setShowUpload(false)}
          onUploaded={fetchImages}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
