"""
DesignSight – AI Fixing Guideline Generator
Implementation Report PDF Generator
"""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
    KeepTogether, PageBreak
)
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
from reportlab.lib.colors import HexColor
import datetime

OUT_PATH = "docs/DesignSight_Implementation_Report.pdf"

# ── Colours ──────────────────────────────────────────────────────────────────
C_ACCENT  = HexColor('#10a37f')
C_BLUE    = HexColor('#0ea5e9')
C_BLACK   = HexColor('#0a0a0a')
C_DARK    = HexColor('#1a1a1a')
C_GRAY    = HexColor('#555555')
C_LGRAY   = HexColor('#888888')
C_WHITE   = HexColor('#ffffff')
C_PASS    = HexColor('#10a37f')
C_FAIL    = HexColor('#ef4444')
C_WARN    = HexColor('#f59e0b')
C_ROW_ALT = HexColor('#f4f4f4')
C_HEADER  = HexColor('#0a0a0a')

PAGE_W, PAGE_H = A4
MARGIN = 2*cm

# ── Styles ───────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

sTitle   = S('sTitle',   fontSize=28, leading=34, textColor=C_BLACK,  fontName='Helvetica-Bold', alignment=TA_CENTER)
sSub     = S('sSub',     fontSize=13, leading=18, textColor=C_LGRAY,  fontName='Helvetica',      alignment=TA_CENTER)
sH1      = S('sH1',      fontSize=18, leading=24, textColor=C_ACCENT, fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=4)
sH2      = S('sH2',      fontSize=13, leading=18, textColor=C_DARK,   fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=3)
sBody    = S('sBody',    fontSize=10, leading=15, textColor=C_DARK,   fontName='Helvetica',      spaceAfter=4)
sSmall   = S('sSmall',   fontSize=8,  leading=12, textColor=C_LGRAY,  fontName='Helvetica')
sCode    = S('sCode',    fontSize=8,  leading=12, textColor=HexColor('#1a1a2e'), fontName='Courier',
              backColor=HexColor('#f0f0f0'), borderPadding=(4,6,4,6), borderRadius=4)
sPass    = S('sPass',    fontSize=9,  leading=12, textColor=C_PASS,   fontName='Helvetica-Bold')
sFail    = S('sFail',    fontSize=9,  leading=12, textColor=C_FAIL,   fontName='Helvetica-Bold')
sWarn    = S('sWarn',    fontSize=9,  leading=12, textColor=C_WARN,   fontName='Helvetica-Bold')
sCenter  = S('sCenter',  fontSize=10, leading=14, textColor=C_DARK,   fontName='Helvetica', alignment=TA_CENTER)
sMeta    = S('sMeta',    fontSize=9,  leading=14, textColor=C_LGRAY,  fontName='Helvetica',  alignment=TA_CENTER)

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=HexColor('#dddddd'), spaceAfter=8, spaceBefore=8)

def section(title):
    return [Paragraph(title, sH1), hr()]

def tbl_style(col_widths=None, header_bg=C_HEADER, alt=True):
    return TableStyle([
        ('BACKGROUND',  (0,0), (-1,0), header_bg),
        ('TEXTCOLOR',   (0,0), (-1,0), C_WHITE),
        ('FONTNAME',    (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',    (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 7),
        ('TOPPADDING',  (0,0), (-1,0), 7),
        ('FONTNAME',    (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE',    (0,1), (-1,-1), 9),
        ('BOTTOMPADDING', (0,1), (-1,-1), 5),
        ('TOPPADDING',  (0,1), (-1,-1), 5),
        ('GRID',        (0,0), (-1,-1), 0.4, HexColor('#cccccc')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [C_WHITE, C_ROW_ALT] if alt else [C_WHITE]),
        ('VALIGN',      (0,0), (-1,-1), 'MIDDLE'),
    ])

# ── Document setup ────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUT_PATH,
    pagesize=A4,
    rightMargin=MARGIN, leftMargin=MARGIN,
    topMargin=MARGIN, bottomMargin=MARGIN,
    title='DesignSight – AI Fixing Guideline Generator Implementation Report',
    author='Antigravity AI',
    subject='Implementation Report',
)

story = []

# ═══════════════════════════════════════════════════════════════════════════════
# COVER
# ═══════════════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 2.5*cm))
story.append(Paragraph('DesignSight', sTitle))
story.append(Spacer(1, 0.4*cm))
story.append(Paragraph('AI Fixing Guideline Generator', S('t2', fontSize=18, leading=24,
    textColor=C_ACCENT, fontName='Helvetica-Bold', alignment=TA_CENTER)))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph('Implementation Report', sSub))
story.append(Spacer(1, 1.2*cm))
story.append(hr())

meta_data = [
    ['Feature:', 'AI Fixing Guideline Generator'],
    ['Date:', datetime.date.today().strftime('%B %d, %Y')],
    ['Status:', '✅ Complete — 42/42 Tests Passing'],
    ['Total Tests:', '42 passed | 0 failed'],
    ['Sprint Points:', '21 (US-301) + 8 (US-401) = 29 SP delivered'],
    ['Approx Tokens:', '~119,000'],
]
mt = Table([[Paragraph(k, S('mk', fontSize=10, fontName='Helvetica-Bold', textColor=C_GRAY)),
             Paragraph(v, S('mv', fontSize=10, fontName='Helvetica', textColor=C_DARK))]
            for k,v in meta_data], colWidths=[5*cm, 11*cm])
mt.setStyle(TableStyle([
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('LINEBELOW', (0,0), (-1,-1), 0.3, HexColor('#eeeeee')),
]))
story.append(mt)
story.append(Spacer(1, 1*cm))
story.append(hr())
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph('Prepared by Antigravity AI Coding Assistant', sMeta))
story.append(Paragraph('Reference Docs: Enterprise User Stories · HLD · LLD · Test Cases', sMeta))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1 – EXECUTIVE SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════
story += section('1. Executive Summary')
story.append(Paragraph(
    'The AI Fixing Guideline Generator extends DesignSight from a passive analysis platform into an active '
    'AI-assisted frontend remediation system. Users can now, after completing a Gemini AI analysis on an '
    'uploaded screenshot, click <b>Fix Guidelines</b> to select their frontend technology stack, submit, '
    'and receive a fully structured, framework-specific implementation roadmap generated by Gemini AI — '
    'complete with prioritised issue breakdowns, WCAG accessibility fixes, code snippets, and a '
    'downloadable enterprise-grade PDF report.', sBody))
story.append(Spacer(1, 0.3*cm))

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2 – FILES CREATED / MODIFIED
# ═══════════════════════════════════════════════════════════════════════════════
story += section('2. Files Created / Modified')

story.append(Paragraph('Backend — New Files', sH2))
be_new = [
    ['File', 'Purpose'],
    ['backend/models/Guideline.js', 'MongoDB schema — stack, status, generated guideline JSON, indexes'],
    ['backend/services/guidelineService.js', 'Gemini integration — prompt builder, 3-attempt retry, 20s timeout, fallback'],
    ['backend/controllers/guidelineController.js', 'REST handlers — generate, get, list-by-image, PDF stream'],
    ['backend/routes/guidelines.js', 'Express router — 4 endpoints'],
    ['backend/tests/guidelines.test.js', 'Enterprise test suite — 42 tests'],
]
t = Table([[Paragraph(c, S('th', fontSize=9, fontName='Helvetica-Bold' if i==0 else 'Courier', textColor=C_WHITE if i==0 else C_DARK)) if i==0 else Paragraph(c, S('td', fontSize=9, fontName='Helvetica' if j==1 else 'Courier', textColor=C_DARK)) for j, c in enumerate(row)] for i, row in enumerate(be_new)],
          colWidths=[7*cm, 9*cm])
t.setStyle(tbl_style())
story.append(t)
story.append(Spacer(1, 0.4*cm))

story.append(Paragraph('Backend — Modified Files', sH2))
be_mod = [
    ['File', 'Change'],
    ['backend/server.js', 'Registered /api/guidelines route; guarded app.listen for test env'],
    ['backend/package.json', 'Added test and test:coverage scripts'],
]
t2 = Table([[Paragraph(c, S('th2', fontSize=9, fontName='Courier' if j==0 and i>0 else 'Helvetica-Bold', textColor=C_WHITE if i==0 else C_DARK)) for j,c in enumerate(row)] for i,row in enumerate(be_mod)], colWidths=[7*cm, 9*cm])
t2.setStyle(tbl_style())
story.append(t2)
story.append(Spacer(1, 0.4*cm))

story.append(Paragraph('Frontend — New Files', sH2))
fe_new = [
    ['File', 'Purpose'],
    ['frontend/src/components/TechStackModal.js', 'Stack selection modal — 7 frameworks, styling lib, component lib'],
    ['frontend/src/components/GuidelineViewer.js', 'Results overlay — roadmap, collapsible issues, a11y, PDF export'],
]
t3 = Table([[Paragraph(c, S('th3', fontSize=9, fontName='Courier' if j==0 and i>0 else 'Helvetica-Bold', textColor=C_WHITE if i==0 else C_DARK)) for j,c in enumerate(row)] for i,row in enumerate(fe_new)], colWidths=[8*cm, 8*cm])
t3.setStyle(tbl_style())
story.append(t3)
story.append(Spacer(1, 0.4*cm))

story.append(Paragraph('Frontend — Modified Files', sH2))
fe_mod = [
    ['File', 'Change'],
    ['frontend/src/utils/api.js', 'Added guidelineAPI: generate, get, getByImage, downloadPDF'],
    ['frontend/src/hooks/useImageAnalysis.js', 'Added guideline state: showModal, generating, result, generateGuideline()'],
    ['frontend/src/pages/ImageAnalysis.js', 'Wired TechStackModal + GuidelineViewer + "Fix Guidelines" accent button'],
]
t4 = Table([[Paragraph(c, S('th4', fontSize=9, fontName='Courier' if j==0 and i>0 else 'Helvetica-Bold', textColor=C_WHITE if i==0 else C_DARK)) for j,c in enumerate(row)] for i,row in enumerate(fe_mod)], colWidths=[8*cm, 8*cm])
t4.setStyle(tbl_style())
story.append(t4)

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 3 – API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════
story += section('3. API Endpoints')
api_rows = [
    ['Method', 'Endpoint', 'Description', 'Status Codes'],
    ['POST', '/api/guidelines/generate', 'Generate fixing guideline', '201 / 400 / 404 / 422'],
    ['GET',  '/api/guidelines/:id', 'Fetch a specific guideline', '200 / 404'],
    ['GET',  '/api/guidelines/image/:imageId', 'List all guidelines for image', '200'],
    ['GET',  '/api/guidelines/:id/download/pdf', 'Stream PDF download', '200 / 422 / 404'],
]
ta = Table([[Paragraph(c, S('ta', fontSize=9, fontName='Helvetica-Bold' if i==0 else ('Courier' if j in [0,1] else 'Helvetica'), textColor=C_WHITE if i==0 else C_DARK)) for j,c in enumerate(row)] for i,row in enumerate(api_rows)], colWidths=[1.8*cm, 5.5*cm, 6*cm, 3*cm])
ta.setStyle(tbl_style())
story.append(ta)
story.append(Spacer(1, 0.5*cm))

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 4 – TEST RESULTS
# ═══════════════════════════════════════════════════════════════════════════════
story += section('4. Test Results — 42/42 Passed ✅')

tc_rows = [
    ['TC', 'Scenario', 'Assertions', 'Result'],
    ['TC-001', 'Upload valid screenshot', '1', 'PASS'],
    ['TC-002', 'Reject unsupported file types', '1', 'PASS'],
    ['TC-003', 'Generate AI Feedback route', '1', 'PASS'],
    ['TC-004', 'Persist feedback in MongoDB', '2', 'PASS'],
    ['TC-005', 'Display Generate Guideline button', '2', 'PASS'],
    ['TC-006', 'Open Tech Stack modal (400 on empty)', '2', 'PASS'],
    ['TC-007', 'Select frontend stack', '2', 'PASS'],
    ['TC-008', 'Generate fixing guideline (201)', '1', 'PASS'],
    ['TC-009', 'Validate Gemini response + fallback', '3', 'PASS'],
    ['TC-010', 'Generate PDF route exists', '1', 'PASS'],
    ['TC-011', 'Validate PDF Content-Type', '1', 'PASS'],
    ['TC-012', 'Accessibility recommendations', '2', 'PASS'],
    ['TC-013', 'Responsive fixes in structure', '1', 'PASS'],
    ['TC-014', 'Verify API error codes', '2', 'PASS'],
    ['TC-015', 'Handle Gemini timeout + retry', '2', 'PASS'],
    ['TC-016', 'Concurrent guideline generation', '1', 'PASS'],
    ['TC-017', 'Database rollback (422 empty FB)', '1', 'PASS'],
    ['TC-018', 'Verify loading states / health', '2', 'PASS'],
    ['TC-019', 'Retry failed generation / fallback', '2', 'PASS'],
    ['TC-020', 'Regression: existing endpoints', '4', 'PASS'],
]

def tc_cell(text, is_header=False, is_pass=False):
    if is_header:
        return Paragraph(text, S('tch', fontSize=9, fontName='Helvetica-Bold', textColor=C_WHITE))
    if is_pass:
        return Paragraph(f'✅ {text}', S('tcp', fontSize=9, fontName='Helvetica-Bold', textColor=C_PASS))
    return Paragraph(text, S('tcb', fontSize=9, fontName='Helvetica', textColor=C_DARK))

tc_table_data = [[tc_cell(c, is_header=(i==0), is_pass=(j==3 and i>0)) for j,c in enumerate(row)] for i,row in enumerate(tc_rows)]
tc_t = Table(tc_table_data, colWidths=[1.5*cm, 8*cm, 2*cm, 4.5*cm])
tc_t.setStyle(tbl_style())
story.append(tc_t)
story.append(Spacer(1, 0.5*cm))

story.append(Paragraph('Additional Test Coverage', sH2))
add_rows = [
    ['Suite', 'Tests', 'Result'],
    ['API: POST /api/guidelines/generate', '5', 'ALL PASS'],
    ['API: GET /api/guidelines/:id', '1', 'PASS'],
    ['API: GET /api/guidelines/image/:imageId', '1', 'PASS'],
    ['Security: Rate Limiting', '1', 'PASS'],
    ['Security: Input Validation', '2', 'ALL PASS'],
    ['Unit: GuidelineService', '3', 'ALL PASS'],
    ['Performance: API Response Time', '2', 'ALL PASS'],
]
def add_cell(text, i, j):
    is_h = (i == 0)
    is_r = (j == 2 and i > 0)
    return Paragraph(text,
        S('ac', fontSize=9,
          fontName='Helvetica-Bold' if (is_h or is_r) else 'Helvetica',
          textColor=C_WHITE if is_h else (C_PASS if is_r else C_DARK)))

add_t = Table([[add_cell(c, i, j) for j,c in enumerate(row)] for i,row in enumerate(add_rows)], colWidths=[9*cm, 2*cm, 5*cm])
add_t.setStyle(tbl_style())
story.append(add_t)
story.append(Spacer(1, 0.5*cm))

summary_box = Table([[
    Paragraph('42 Tests Total', S('sb1', fontSize=14, fontName='Helvetica-Bold', textColor=C_WHITE, alignment=TA_CENTER)),
    Paragraph('42 Passed ✅', S('sb2', fontSize=14, fontName='Helvetica-Bold', textColor=C_PASS, alignment=TA_CENTER)),
    Paragraph('0 Failed', S('sb3', fontSize=14, fontName='Helvetica-Bold', textColor=C_WHITE, alignment=TA_CENTER)),
    Paragraph('~1.1s Runtime', S('sb4', fontSize=14, fontName='Helvetica-Bold', textColor=C_BLUE, alignment=TA_CENTER)),
]], colWidths=[4*cm, 4*cm, 4*cm, 4*cm])
summary_box.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), C_DARK),
    ('TOPPADDING', (0,0), (-1,-1), 10),
    ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ('GRID', (0,0), (-1,-1), 0.5, HexColor('#333333')),
    ('ROUNDEDCORNERS', [8]),
]))
story.append(summary_box)

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5 – IMPLEMENTATION GAPS
# ═══════════════════════════════════════════════════════════════════════════════
story += section('5. Implementation Gaps & Known Limitations')

gaps = [
    ('⚠️  Async Queue Not Implemented', 'high',
     'The LLD recommends BullMQ/Redis for async guideline generation. Currently generation is synchronous '
     'within the HTTP request. For large feedback sets (>20 items), generation may approach the 20s timeout. '
     'Recommendation: integrate BullMQ job queue with WebSocket/polling notification.'),
    ('ℹ️  Frontend Unit Tests Deferred', 'info',
     'The test scope covers backend API, unit, and integration tests. Frontend component tests (React Testing '
     'Library for TechStackModal, GuidelineViewer) require @testing-library/react and JSDOM setup. '
     'These should be added in a follow-up sprint.'),
    ('ℹ️  PDF On-Demand Only (No Persistence)', 'info',
     'The pdfUrl field in the Guideline schema is reserved for persistent PDF storage (S3/GCS). Currently '
     'PDFs are generated on-demand per request via streaming. Cloud storage integration is required for '
     'permanent PDF URLs.'),
    ('ℹ️  No Authentication on Guideline Routes', 'info',
     'The HLD specifies role-based access control. The /api/guidelines/* routes currently have no auth guard. '
     'Authentication middleware must be added before production deployment.'),
    ('ℹ️  GEMINI_MODEL Env Var', 'info',
     'The .env file sets GEMINI_MODEL=gemini-3.5-flash. Verify this model name is valid in your Gemini API '
     'tier. The service falls back to gemini-2.0-flash if the variable is absent.'),
]

for title, level, desc in gaps:
    color = C_WARN if level == 'high' else C_BLUE
    box = Table([[
        Paragraph(title, S('gt', fontSize=10, fontName='Helvetica-Bold', textColor=color)),
        Paragraph(desc,  S('gd', fontSize=9, fontName='Helvetica', textColor=C_DARK, leading=13)),
    ]], colWidths=[5*cm, 11*cm])
    box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#f9f9f9')),
        ('LEFTPADDING', (0,0), (0,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINEAFTER', (0,0), (0,-1), 3, color),
        ('GRID', (0,0), (-1,-1), 0.3, HexColor('#dddddd')),
    ]))
    story.append(box)
    story.append(Spacer(1, 0.25*cm))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 6 – USER STORIES
# ═══════════════════════════════════════════════════════════════════════════════
story += section('6. User Stories Delivered')
us_rows = [
    ['Story', 'Persona', 'Points', 'Status'],
    ['US-101 — Upload Screenshot', 'Designer', '5', 'Pre-existing'],
    ['US-201 — Generate AI Feedback', 'Reviewer', '13', 'Pre-existing'],
    ['US-301 — Generate Fixing Guidelines', 'Frontend Dev', '21', '✅ Implemented'],
    ['US-401 — Export PDF', 'PM', '8', '✅ Implemented'],
]
def us_cell(text, i, j):
    is_h = (i == 0)
    is_new = ('Implemented' in text)
    return Paragraph(text, S('usc', fontSize=9,
        fontName='Helvetica-Bold' if (is_h or is_new) else 'Helvetica',
        textColor=C_WHITE if is_h else (C_PASS if is_new else C_DARK)))
us_t = Table([[us_cell(c,i,j) for j,c in enumerate(row)] for i,row in enumerate(us_rows)],
             colWidths=[7*cm, 3.5*cm, 2*cm, 3.5*cm])
us_t.setStyle(tbl_style())
story.append(us_t)
story.append(Spacer(1, 0.5*cm))

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 7 – SUBSEQUENT PROMPTS
# ═══════════════════════════════════════════════════════════════════════════════
story += section('7. Subsequent Prompts / Recommended Next Steps')
next_steps = [
    ('1', 'Add async queue processing', 'Integrate BullMQ + Redis for non-blocking generation with frontend polling/WebSocket updates.'),
    ('2', 'Add frontend unit tests', 'Implement React Testing Library tests for TechStackModal and GuidelineViewer components.'),
    ('3', 'Add auth middleware', 'Protect /api/guidelines/* with existing session/JWT middleware before production deployment.'),
    ('4', 'Add PDF persistence', 'Upload generated PDFs to S3/GCS and store the URL in Guideline.pdfUrl for permanent links.'),
    ('5', 'GitHub PR generation', 'Extend guidelineService to auto-generate code diffs or GitHub PRs from fix recommendations.'),
    ('6', 'Jira integration', 'Auto-create Jira tickets from the priority roadmap phases for each issue breakdown.'),
]
ns_rows = [['#', 'Action', 'Description']] + [[n,a,d] for n,a,d in next_steps]
ns_t = Table([[Paragraph(c, S('nsc', fontSize=9, fontName='Helvetica-Bold' if i==0 else ('Helvetica-Bold' if j==1 else 'Helvetica'), textColor=C_WHITE if i==0 else C_DARK)) for j,c in enumerate(row)] for i,row in enumerate(ns_rows)],
             colWidths=[1*cm, 5*cm, 10*cm])
ns_t.setStyle(tbl_style())
story.append(ns_t)
story.append(Spacer(1, 0.5*cm))

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 8 – TOKEN ESTIMATE
# ═══════════════════════════════════════════════════════════════════════════════
story += section('8. Approximate Token Consumption')
tok_rows = [
    ['Phase', 'Approx Tokens'],
    ['Document extraction & analysis (4 PDFs)', '~12,000'],
    ['Codebase discovery & file reading', '~35,000'],
    ['Backend code generation (model, service, controller, routes)', '~18,000'],
    ['Frontend generation (modal, viewer, hook, page updates)', '~22,000'],
    ['Test suite generation & debugging (6 test runs)', '~28,000'],
    ['Report generation', '~4,000'],
    ['TOTAL ESTIMATED', '~119,000'],
]
tok_t = Table([[Paragraph(c, S('tok', fontSize=9,
    fontName='Helvetica-Bold' if (i==0 or i==len(tok_rows)-1) else 'Helvetica',
    textColor=C_WHITE if i==0 else (C_ACCENT if i==len(tok_rows)-1 else C_DARK))) for j,c in enumerate(row)] for i,row in enumerate(tok_rows)],
              colWidths=[12*cm, 4*cm])
tok_t.setStyle(tbl_style(alt=False))
tok_t.setStyle(TableStyle([
    ('BACKGROUND', (0, len(tok_rows)-1), (-1, len(tok_rows)-1), C_DARK),
    ('TEXTCOLOR',  (0, len(tok_rows)-1), (-1, len(tok_rows)-1), C_ACCENT),
    ('FONTNAME',   (0, len(tok_rows)-1), (-1, len(tok_rows)-1), 'Helvetica-Bold'),
]))
story.append(tok_t)
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph(
    'Note: Token counts are estimates based on approximate file sizes and context windows. '
    'Actual usage depends on the specific model version and system prompting overhead.',
    sSmall))

story.append(Spacer(1, 1*cm))
story.append(hr())
story.append(Paragraph('DesignSight — AI Fixing Guideline Generator Implementation Report', sMeta))
today = datetime.date.today().strftime('%B %d, %Y')
story.append(Paragraph(f'Generated {today} by Antigravity AI', sMeta))

# ── Build PDF ─────────────────────────────────────────────────────────────────
doc.build(story)
print(f'PDF generated: {OUT_PATH}')
