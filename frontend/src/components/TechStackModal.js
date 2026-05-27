import React, { useState } from 'react';

const CLOSE_ICON = 'M18 6 6 18M6 6l12 12';
const SPARK_ICON = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';

function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const FRONTEND_STACKS = ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js'];
const STYLING_LIBS   = ['Tailwind CSS', 'CSS Modules', 'Styled Components', 'Chakra UI', 'Sass/SCSS', 'Plain CSS'];
const COMPONENT_LIBS = ['shadcn/ui', 'Material UI', 'Ant Design', 'Radix UI', 'Headless UI', 'None'];

/** Pill toggle button for tech-stack options */
function OptionPill({ label, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(label)}
      type="button"
      style={{
        padding: '6px 14px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontFamily: 'var(--font-body, sans-serif)',
        fontWeight: selected ? 500 : 400,
        border: selected
          ? '1px solid rgba(16,163,127,0.6)'
          : '1px solid rgba(255,255,255,0.12)',
        background: selected
          ? 'rgba(16,163,127,0.15)'
          : 'rgba(255,255,255,0.04)',
        color: selected ? '#10a37f' : 'rgba(255,255,255,0.55)',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

/** Group label */
function GroupLabel({ children }) {
  return (
    <p style={{
      fontSize: '10px',
      fontFamily: 'var(--font-body, sans-serif)',
      color: 'rgba(255,255,255,0.35)',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '10px',
    }}>
      {children}
    </p>
  );
}

/**
 * TechStackModal — allows user to select framework, styling, and component library
 * before submitting the guideline generation request.
 */
export default function TechStackModal({ imageId, projectId, onClose, onGenerate }) {
  const [frontendStack,     setFrontendStack]     = useState('React');
  const [stylingLibrary,    setStylingLibrary]    = useState('Tailwind CSS');
  const [componentLibrary,  setComponentLibrary]  = useState('None');
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState(null);

  const handleSubmit = async () => {
    // Guard: ensure required IDs are present
    if (!imageId || !projectId) {
      setError(`Missing required context: imageId="${imageId}", projectId="${projectId}". Please refresh the page and try again.`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = { imageId, projectId, frontendStack, stylingLibrary, componentLibrary };
      console.log('🔧 TechStackModal: Submitting payload', payload);
      await onGenerate(payload);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      id="tech-stack-modal-backdrop"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={(e) => e.target.id === 'tech-stack-modal-backdrop' && onClose()}
    >
      {/* Modal card */}
      <div
        id="tech-stack-modal"
        style={{
          width: '100%', maxWidth: '520px',
          background: 'rgba(15,15,20,0.92)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-heading, serif)',
              fontStyle: 'italic',
              fontSize: '22px',
              color: '#fff',
              marginBottom: '6px',
            }}>
              Generate Fixing Guideline
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body, sans-serif)' }}>
              Select your tech stack to receive framework-specific remediation roadmap
            </p>
          </div>
          <button
            id="tech-stack-modal-close"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)', padding: '4px',
            }}
          >
            <Icon d={CLOSE_ICON} size={18} />
          </button>
        </div>

        {/* ── Frontend Framework ── */}
        <div style={{ marginBottom: '22px' }}>
          <GroupLabel>Frontend Framework</GroupLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {FRONTEND_STACKS.map(s => (
              <OptionPill
                key={s} label={s}
                selected={frontendStack === s}
                onClick={setFrontendStack}
              />
            ))}
          </div>
        </div>

        {/* ── Styling Library ── */}
        <div style={{ marginBottom: '22px' }}>
          <GroupLabel>Styling Library</GroupLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {STYLING_LIBS.map(s => (
              <OptionPill
                key={s} label={s}
                selected={stylingLibrary === s}
                onClick={setStylingLibrary}
              />
            ))}
          </div>
        </div>

        {/* ── Component Library ── */}
        <div style={{ marginBottom: '28px' }}>
          <GroupLabel>Component Library</GroupLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {COMPONENT_LIBS.map(s => (
              <OptionPill
                key={s} label={s}
                selected={componentLibrary === s}
                onClick={setComponentLibrary}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#f87171',
            fontFamily: 'var(--font-body, sans-serif)',
          }}>
            {error}
          </div>
        )}

        {/* Stack summary */}
        <div style={{
          background: 'rgba(16,163,127,0.06)',
          border: '1px solid rgba(16,163,127,0.2)',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '22px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'var(--font-body, sans-serif)',
        }}>
          <span style={{ color: '#10a37f' }}>✦ </span>
          {frontendStack} · {stylingLibrary}{componentLibrary !== 'None' ? ` · ${componentLibrary}` : ''}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            id="tech-stack-modal-cancel"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '9999px',
              color: 'rgba(255,255,255,0.5)',
              padding: '10px 22px',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body, sans-serif)',
            }}
          >
            Cancel
          </button>
          <button
            id="tech-stack-modal-generate"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: loading ? 'rgba(16,163,127,0.4)' : 'rgba(16,163,127,0.9)',
              border: 'none',
              borderRadius: '9999px',
              color: '#fff',
              padding: '10px 24px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontFamily: 'var(--font-body, sans-serif)',
              transition: 'all 0.18s ease',
            }}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block', width: 14, height: 14,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Generating…
              </>
            ) : (
              <>
                <Icon d={SPARK_ICON} size={14} />
                Generate Guideline
              </>
            )}
          </button>
        </div>

        {/* Spinner keyframe injected inline */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
