import React, { useState } from 'react';

// ── Tiny inline icon ────────────────────────────────────────────────────────────
function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  close:    'M18 6 6 18M6 6l12 12',
  spark:    'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  check:    'M20 6L9 17l-5-5',
  code:     'M16 18l6-6-6-6M8 6l-6 6 6 6',
};

const STACK_OPTIONS = [
  { value: 'react',   label: 'React 18',   icon: '⚛️' },
  { value: 'nextjs',  label: 'Next.js 14', icon: '▲' },
  { value: 'vue',     label: 'Vue 3',      icon: '💚' },
  { value: 'nuxt',    label: 'Nuxt 3',     icon: '🟩' },
  { value: 'angular', label: 'Angular 17', icon: '🔴' },
  { value: 'svelte',  label: 'Svelte 5',   icon: '🧡' },
  { value: 'vanilla', label: 'Vanilla JS', icon: '🍦' },
];

const STYLING_OPTIONS = [
  { value: 'tailwind',          label: 'Tailwind CSS' },
  { value: 'css-modules',       label: 'CSS Modules' },
  { value: 'styled-components', label: 'Styled Components' },
  { value: 'sass',              label: 'SASS / SCSS' },
  { value: 'bootstrap',         label: 'Bootstrap 5' },
  { value: 'chakra-ui',         label: 'Chakra UI' },
  { value: 'material-ui',       label: 'Material UI' },
  { value: 'vanilla-css',       label: 'Vanilla CSS' },
];

const COMPONENT_OPTIONS = [
  { value: 'none',      label: 'None' },
  { value: 'shadcn',    label: 'shadcn/ui' },
  { value: 'headlessui',label: 'Headless UI' },
  { value: 'radix',     label: 'Radix UI' },
  { value: 'mui',       label: 'MUI' },
  { value: 'ant-design',label: 'Ant Design' },
  { value: 'chakra',    label: 'Chakra UI' },
];

/**
 * TechStackModal
 * Props:
 *  - imageId, projectId   – required for API call
 *  - onClose()            – called to close
 *  - onGenerated(result)  – called with API result when done
 *  - generateGuideline    – async fn to call
 *  - generating           – boolean loading state
 */
export default function TechStackModal({
  imageId,
  projectId,
  onClose,
  onGenerated,
  generateGuideline,
  generating
}) {
  const [stack, setStack]     = useState('react');
  const [styling, setStyling] = useState('tailwind');
  const [component, setComponent] = useState('none');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await generateGuideline({
      imageId,
      projectId,
      frontendStack: stack,
      stylingLibrary: styling,
      componentLibrary: component
    });
    if (result) onGenerated(result);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
    >
      <div className="glass-panel-strong w-full max-w-lg p-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading italic text-white text-2xl leading-none mb-1">
              Generate Fixing Guidelines
            </h2>
            <p className="text-xs font-body text-white/40">
              Select your tech stack for framework-specific remediation roadmap
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
            <Icon d={ICONS.close} size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Frontend Framework */}
          <div>
            <label className="text-xs font-body text-white/45 uppercase tracking-widest block mb-2">
              Frontend Framework *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STACK_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  id={`stack-option-${opt.value}`}
                  onClick={() => setStack(opt.value)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-body text-left transition-all duration-200"
                  style={{
                    background: stack === opt.value ? 'rgba(16,163,127,0.18)' : 'rgba(0,0,0,0.45)',
                    border: `1px solid ${stack === opt.value ? 'rgba(16,163,127,0.55)' : 'rgba(255,255,255,0.10)'}`,
                    color: stack === opt.value ? '#10a37f' : 'rgba(255,255,255,0.65)'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{opt.icon}</span>
                  <span>{opt.label}</span>
                  {stack === opt.value && (
                    <span className="ml-auto text-[#10a37f]"><Icon d={ICONS.check} size={12} /></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Styling Library */}
          <div>
            <label className="text-xs font-body text-white/45 uppercase tracking-widest block mb-2">
              Styling Library
            </label>
            <select
              id="styling-library-select"
              value={styling}
              onChange={e => setStyling(e.target.value)}
              className="glass-input w-full px-4 py-3 text-sm font-body"
            >
              {STYLING_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} style={{ background: '#111' }}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Component Library */}
          <div>
            <label className="text-xs font-body text-white/45 uppercase tracking-widest block mb-2">
              Component Library
            </label>
            <select
              id="component-library-select"
              value={component}
              onChange={e => setComponent(e.target.value)}
              className="glass-input w-full px-4 py-3 text-sm font-body"
            >
              {COMPONENT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} style={{ background: '#111' }}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Info bar */}
          <div className="rounded-xl px-4 py-3 text-xs font-body text-white/50 flex items-start gap-2"
               style={{ background: 'rgba(16,163,127,0.07)', border: '1px solid rgba(16,163,127,0.15)' }}>
            <span className="text-[#10a37f] mt-0.5 flex-shrink-0"><Icon d={ICONS.spark} size={12} /></span>
            Gemini AI will generate framework-specific fixes and accessibility improvements based on your existing AI feedback.
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5 text-sm">
              Cancel
            </button>
            <button
              id="generate-guideline-submit-btn"
              type="submit"
              disabled={generating || !stack}
              className="btn-primary px-7 py-2.5 text-sm flex items-center gap-2 disabled:opacity-40"
            >
              <Icon d={ICONS.spark} size={14} />
              {generating ? 'Generating…' : 'Generate Guidelines'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
