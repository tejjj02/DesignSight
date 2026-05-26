import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';

// ── Tiny icons (inline SVG to avoid deps) ─────────────────────────────────────
function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  folder:  'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  image:   'M21 15l-5-5L5 20M3 3h18v18H3zM8.5 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  plus:    'M12 5v14M5 12h14',
  arrow:   'M5 12h14M12 5l7 7-7 7',
  check:   'M20 6L9 17l-5-5',
  clock:   'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  spark:   'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  trash:   'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
};

// ── Stat badge ────────────────────────────────────────────────────────────────
function StatBadge({ label, value, accent = false }) {
  return (
    <div className="stats-card p-5 flex flex-col gap-1">
      <p className="text-xs font-body text-white/45 uppercase tracking-widest">{label}</p>
      <p className={`text-3xl font-heading italic ${accent ? 'gradient-text' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

// ── Project card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onClick, onDelete }) {
  const date = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  return (
    <div
      className="glass-card p-5 cursor-pointer group"
      onClick={() => onClick(project._id)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: 'rgba(16,163,127,0.18)', border: '1px solid rgba(16,163,127,0.3)' }}>
          <span className="text-[#10a37f]"><Icon d={ICONS.folder} size={18} /></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-body text-white/35">{date}</span>
          <button
            id={`delete-project-btn-${project._id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project._id, project.name);
            }}
            className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
            title="Delete Project"
          >
            <Icon d={ICONS.trash} size={14} />
          </button>
        </div>
      </div>

      {/* Name / description */}
      <h3 className="font-heading italic text-white text-lg leading-tight line-clamp-2 mb-1">
        {project.name}
      </h3>
      {project.description && (
        <p className="text-xs font-body text-white/50 line-clamp-2 mb-3 leading-relaxed">
          {project.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <span className="text-xs font-body text-white/40 flex items-center gap-1.5">
          <Icon d={ICONS.image} size={12} />
          {project.images?.length || 0} images
        </span>
        <span className="text-xs font-body text-[#10a37f] flex items-center gap-1
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Open <Icon d={ICONS.arrow} size={12} />
        </span>
      </div>
    </div>
  );
}

// ── Create Modal ──────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    await onCreate(form);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-panel-strong w-full max-w-md p-7 animate-fade-in">
        <h2 className="font-heading italic text-white text-2xl mb-1">New Project</h2>
        <p className="text-xs font-body text-white/45 mb-6">
          Give your design project a name to get started.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-body text-white/55 uppercase tracking-widest mb-1.5">
              Project Name *
            </label>
            <input
              autoFocus
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Mobile Redesign 2025"
              className="glass-input w-full px-4 py-3 text-sm font-body"
            />
          </div>

          <div>
            <label className="block text-xs font-body text-white/55 uppercase tracking-widest mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the project..."
              className="glass-input w-full px-4 py-3 text-sm font-body resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={!form.name.trim() || busy}
                    className="btn-primary px-6 py-2.5 text-sm disabled:opacity-40">
              {busy ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ──────────────────────────────────────────────────
function DeleteConfirmationModal({ projectName, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    await onConfirm();
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-panel-strong w-full max-w-md p-7 animate-fade-in">
        <h2 className="font-heading italic text-white text-2xl mb-1 text-red-400">Delete Project</h2>
        <p className="text-sm font-body text-white/70 mb-6 leading-relaxed">
          Are you sure you want to delete <strong className="text-white">"{projectName}"</strong>? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={busy} className="btn-secondary px-5 py-2.5 text-sm">
            Cancel
          </button>
          <button
            id="confirm-delete-project-btn"
            onClick={handleConfirm}
            disabled={busy}
            className="btn-primary px-6 py-2.5 text-sm disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    projects,
    loading,
    error,
    showCreate,
    setShowCreate,
    deleteTarget,
    setDeleteTarget,
    fetchProjects,
    handleCreate,
    handleDelete,
    executeDelete
  } = useProjects();

  const totalImages = projects.reduce((n, p) => n + (p.images?.length || 0), 0);
  const totalAnalyses = projects.reduce((n, p) => n + (p.images?.filter(i => i.analysisStatus === 'completed').length || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Page header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-body text-white/35 uppercase tracking-[0.25em] mb-2">
            Dashboard
          </p>
          <h1 className="font-heading italic text-white text-4xl leading-none">
            Your Projects
          </h1>
        </div>
        <button
          id="create-project-btn"
          onClick={() => setShowCreate(true)}
          className="btn-primary px-6 py-3 text-sm flex items-center gap-2"
        >
          <Icon d={ICONS.plus} size={14} />
          New Project
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatBadge label="Total Projects"  value={loading ? '…' : projects.length} accent />
        <StatBadge label="Images Uploaded" value={loading ? '…' : totalImages} />
        <StatBadge label="AI Analyses"     value={loading ? '…' : totalAnalyses} />
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card p-4 mb-6 flex items-center gap-3"
             style={{ borderColor: 'rgba(248,113,113,0.3)' }}>
          <span className="text-[#f87171] text-sm font-body">{error}</span>
          <button onClick={fetchProjects} className="ml-auto text-xs btn-secondary px-3 py-1.5">
            Retry
          </button>
        </div>
      )}

      {/* Projects grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-36 animate-pulse"
                 style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel py-20 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
               style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span className="text-white/30"><Icon d={ICONS.folder} size={28} /></span>
          </div>
          <h3 className="font-heading italic text-white text-xl mb-2">No projects yet</h3>
          <p className="text-sm font-body text-white/45 max-w-xs mb-6 leading-relaxed">
            Create your first project and upload a design to get instant AI feedback.
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary px-7 py-3 text-sm">
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard
              key={project._id}
              project={project}
              onClick={id => navigate(`/projects/${id}`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {deleteTarget && (
        <DeleteConfirmationModal
          projectName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={executeDelete}
        />
      )}
    </div>
  );
};

export default Dashboard;
