import React, { useState } from 'react';
import { guidelineAPI } from '../utils/api';

const DOWNLOAD_ICON = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3';
const REFRESH_ICON  = 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15';
const SPARK_ICON    = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';

function Icon({ d, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/** Severity badge chip */
function SevBadge({ sev }) {
  const cfg = {
    high:   { c: '#f87171', bg: 'rgba(248,113,113,0.12)' },
    medium: { c: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    low:    { c: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  };
  const s = cfg[sev] || cfg.low;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: '9999px', fontSize: '10px',
      color: s.c, background: s.bg, textTransform: 'capitalize',
      fontFamily: 'var(--font-body, sans-serif)',
    }}>
      {sev || 'low'}
    </span>
  );
}

/** Collapsible section */
function Section({ title, count, accent = '#10a37f', children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '14px',
      overflow: 'hidden',
      marginBottom: '14px',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.03)',
          border: 'none', padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: '10px',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          width: 7, height: 7, borderRadius: '50%', background: accent, flexShrink: 0,
        }} />
        <span style={{
          flex: 1, fontSize: '13px', fontWeight: 500, color: '#fff',
          fontFamily: 'var(--font-heading, serif)', fontStyle: 'italic',
        }}>
          {title}
        </span>
        {count != null && (
          <span style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.35)',
            fontFamily: 'var(--font-body, sans-serif)',
          }}>
            {count} item{count !== 1 ? 's' : ''}
          </span>
        )}
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Single component-fix card */
function ComponentFixCard({ fix, index }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '10px',
      padding: '14px',
      marginBottom: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: fix.severity === 'high' ? '#f87171' : fix.severity === 'medium' ? '#fbbf24' : '#38bdf8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 700, color: '#000',
        }}>
          {index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '13px', fontWeight: 500, color: '#fff',
              fontFamily: 'var(--font-body, sans-serif)',
            }}>
              {fix.component || 'Component'}
            </span>
            <SevBadge sev={fix.severity} />
          </div>
          <p style={{
            fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px',
            fontFamily: 'var(--font-body, sans-serif)', lineHeight: 1.5,
          }}>
            {fix.issue}
          </p>
        </div>
      </div>
      {fix.implementation?.description && (
        <div style={{
          background: 'rgba(16,163,127,0.05)',
          border: '1px solid rgba(16,163,127,0.12)',
          borderRadius: '8px', padding: '10px 12px', marginTop: '8px',
        }}>
          <p style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
            fontFamily: 'var(--font-body, sans-serif)',
          }}>
            Implementation
          </p>
          <p style={{
            fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6,
            fontFamily: 'var(--font-body, sans-serif)',
          }}>
            {fix.implementation.description}
          </p>
          {fix.implementation?.codeExample && (
            <pre style={{
              marginTop: '8px', padding: '10px', borderRadius: '8px',
              background: 'rgba(0,0,0,0.4)',
              fontSize: '11px', color: '#a6e22e', lineHeight: 1.5,
              overflow: 'auto', maxHeight: '200px',
              fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {fix.implementation.codeExample}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * GuidelineViewer — renders the generated Gemini roadmap + PDF download
 */
export default function GuidelineViewer({ guidelineId, guidelines, frontendStack, onRetry }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError,   setPdfError]   = useState(null);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const blob = await guidelineAPI.downloadGuidelinePdf(guidelineId);
      const url  = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `guideline-${frontendStack || 'roadmap'}-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError('PDF download failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  if (!guidelines) return null;

  const exec       = guidelines.executiveSummary || {};
  const roadmap    = guidelines.priorityRoadmap || [];
  const components = guidelines.componentFixes || [];
  const a11y       = guidelines.accessibilityFixes || [];
  const responsive = guidelines.responsiveFixes || [];
  const refactor   = guidelines.refactoringRecommendations || [];
  const testing    = guidelines.testingRecommendations || [];

  return (
    <div
      id="guideline-viewer"
      style={{
        background: 'rgba(12,12,18,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '18px',
        overflow: 'hidden',
        marginTop: '20px',
      }}
    >
      {/* ── Header bar ── */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(16,163,127,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icon d={SPARK_ICON} size={16} />
          <div>
            <p style={{
              fontSize: '14px', fontWeight: 500, color: '#fff',
              fontFamily: 'var(--font-heading, serif)', fontStyle: 'italic',
            }}>
              AI Fixing Guideline
            </p>
            <p style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.4)',
              fontFamily: 'var(--font-body, sans-serif)', marginTop: '2px',
            }}>
              {frontendStack} · {exec.totalIssues || components.length} issues · Est. {exec.estimatedEffort || 'N/A'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onRetry && (
            <button
              id="guideline-retry-btn"
              onClick={onRetry}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '9999px', color: 'rgba(255,255,255,0.5)',
                padding: '7px 14px', fontSize: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontFamily: 'var(--font-body, sans-serif)',
              }}
            >
              <Icon d={REFRESH_ICON} size={12} /> Regenerate
            </button>
          )}
          <button
            id="guideline-pdf-download-btn"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            style={{
              background: 'rgba(16,163,127,0.8)', border: 'none',
              borderRadius: '9999px', color: '#fff',
              padding: '7px 16px', fontSize: '12px', cursor: pdfLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500,
              fontFamily: 'var(--font-body, sans-serif)', opacity: pdfLoading ? 0.6 : 1,
            }}
          >
            <Icon d={DOWNLOAD_ICON} size={12} />
            {pdfLoading ? 'Downloading…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {pdfError && (
        <div style={{
          padding: '10px 24px', background: 'rgba(248,113,113,0.08)',
          fontSize: '12px', color: '#f87171', fontFamily: 'var(--font-body, sans-serif)',
        }}>
          {pdfError}
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>

        {/* Executive Summary */}
        {exec.overview && (
          <div style={{
            background: 'rgba(16,163,127,0.06)',
            border: '1px solid rgba(16,163,127,0.18)',
            borderRadius: '14px', padding: '18px 20px', marginBottom: '20px',
          }}>
            <p style={{
              fontSize: '11px', color: '#10a37f', textTransform: 'uppercase',
              letterSpacing: '0.1em', marginBottom: '8px',
              fontFamily: 'var(--font-body, sans-serif)',
            }}>
              Executive Summary
            </p>
            <p style={{
              fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65,
              fontFamily: 'var(--font-body, sans-serif)',
            }}>
              {exec.overview}
            </p>
            <div style={{
              display: 'flex', gap: '20px', marginTop: '14px', flexWrap: 'wrap',
            }}>
              {[
                { label: 'Total Issues',  value: exec.totalIssues  || components.length },
                { label: 'Critical',      value: exec.criticalCount || 0 },
                { label: 'Est. Effort',   value: exec.estimatedEffort || 'N/A' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body,sans-serif)' }}>{label}</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-heading,serif)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority Roadmap */}
        {roadmap.length > 0 && (
          <Section title="Priority Roadmap" count={roadmap.length} accent="#fbbf24">
            {roadmap.map((phase, i) => (
              <div key={i} style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                padding: '12px 0',
                borderBottom: i < roadmap.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{
                  minWidth: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(251,191,36,0.15)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, color: '#fbbf24',
                }}>
                  {phase.priority || i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '13px', fontWeight: 500, color: '#fff',
                    fontFamily: 'var(--font-body, sans-serif)',
                  }}>
                    {phase.title || phase.phase}
                  </p>
                  <p style={{
                    fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '3px',
                    fontFamily: 'var(--font-body, sans-serif)', lineHeight: 1.5,
                  }}>
                    {phase.description}
                  </p>
                  {phase.estimatedHours && (
                    <p style={{
                      fontSize: '11px', color: 'rgba(251,191,36,0.7)', marginTop: '4px',
                      fontFamily: 'var(--font-body, sans-serif)',
                    }}>
                      ~{phase.estimatedHours}h estimated
                    </p>
                  )}
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* Component Fixes */}
        {components.length > 0 && (
          <Section title="Component-Level Fixes" count={components.length} accent="#f87171">
            {components.map((fix, i) => (
              <ComponentFixCard key={i} fix={fix} index={i} />
            ))}
          </Section>
        )}

        {/* Accessibility Fixes */}
        {a11y.length > 0 && (
          <Section title="Accessibility Fixes (WCAG 2.1)" count={a11y.length} accent="#34d399">
            {a11y.map((fix, i) => (
              <div key={i} style={{
                padding: '10px 0',
                borderBottom: i < a11y.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <p style={{
                  fontSize: '12px', fontWeight: 500, color: '#34d399',
                  fontFamily: 'var(--font-body, sans-serif)',
                }}>
                  {fix.wcagGuideline || 'WCAG Guideline'}
                </p>
                <p style={{
                  fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '3px',
                  fontFamily: 'var(--font-body, sans-serif)', lineHeight: 1.5,
                }}>
                  {fix.issue}
                </p>
                {fix.implementation && (
                  <p style={{
                    fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px',
                    fontFamily: 'var(--font-body, sans-serif)',
                  }}>
                    Fix: {fix.implementation}
                  </p>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Responsive Fixes */}
        {responsive.length > 0 && (
          <Section title="Responsive Design Fixes" count={responsive.length} accent="#a78bfa">
            {responsive.map((fix, i) => (
              <div key={i} style={{
                padding: '10px 0',
                borderBottom: i < responsive.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '9999px', fontSize: '10px',
                    color: '#a78bfa', background: 'rgba(167,139,250,0.12)',
                    fontFamily: 'var(--font-body, sans-serif)',
                  }}>
                    {fix.breakpoint || 'all'}
                  </span>
                  <SevBadge sev={fix.priority} />
                </div>
                <p style={{
                  fontSize: '12px', color: 'rgba(255,255,255,0.55)',
                  fontFamily: 'var(--font-body, sans-serif)', lineHeight: 1.5,
                }}>
                  {fix.issue}
                </p>
                {fix.implementation && (
                  <p style={{
                    fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px',
                    fontFamily: 'var(--font-body, sans-serif)',
                  }}>
                    Fix: {fix.implementation}
                  </p>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Refactoring Recommendations */}
        {refactor.length > 0 && (
          <Section title="Refactoring Recommendations" count={refactor.length} accent="#38bdf8">
            {refactor.map((rec, i) => (
              <div key={i} style={{
                padding: '10px 0',
                borderBottom: i < refactor.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <p style={{
                  fontSize: '13px', fontWeight: 500, color: '#38bdf8',
                  fontFamily: 'var(--font-body, sans-serif)',
                }}>
                  {rec.title}
                </p>
                <p style={{
                  fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '3px',
                  fontFamily: 'var(--font-body, sans-serif)', lineHeight: 1.5,
                }}>
                  {rec.rationale}
                </p>
              </div>
            ))}
          </Section>
        )}

        {/* Testing Recommendations */}
        {testing.length > 0 && (
          <Section title="Testing Recommendations" count={testing.length} accent="#fb923c">
            {testing.map((test, i) => (
              <div key={i} style={{
                padding: '8px 0',
                borderBottom: i < testing.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '9999px', fontSize: '10px',
                  color: '#fb923c', background: 'rgba(251,146,60,0.12)',
                  fontFamily: 'var(--font-body, sans-serif)', flexShrink: 0, marginTop: '1px',
                }}>
                  {test.testType || 'test'}
                </span>
                <div>
                  <p style={{
                    fontSize: '12px', color: 'rgba(255,255,255,0.6)',
                    fontFamily: 'var(--font-body, sans-serif)',
                  }}>
                    {test.description}
                  </p>
                  {test.tool && (
                    <p style={{
                      fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px',
                      fontFamily: 'var(--font-body, sans-serif)',
                    }}>
                      Tool: {test.tool}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}
