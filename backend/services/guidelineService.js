const { GoogleGenerativeAI } = require('@google/generative-ai');

class GuidelineService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    });
  }

  /**
   * Build a framework-specific prompt from feedback items
   */
  buildPrompt({ feedbackItems, frontendStack, stylingLibrary, componentLibrary }) {
    const stackLabel = {
      react: 'React 18',
      vue: 'Vue 3',
      angular: 'Angular 17',
      svelte: 'Svelte 5',
      nextjs: 'Next.js 14',
      nuxt: 'Nuxt 3',
      vanilla: 'Vanilla JS/HTML/CSS'
    }[frontendStack] || frontendStack;

    const stylingLabel = {
      tailwind: 'Tailwind CSS',
      'css-modules': 'CSS Modules',
      'styled-components': 'Styled Components',
      sass: 'SASS/SCSS',
      bootstrap: 'Bootstrap 5',
      'chakra-ui': 'Chakra UI',
      'material-ui': 'Material UI',
      'vanilla-css': 'Vanilla CSS'
    }[stylingLibrary] || stylingLibrary;

    const feedbackSummary = feedbackItems.map((f, i) =>
      `[${i + 1}] ID:${f._id} | Severity:${f.severity} | Category:${f.category}\n  Title: ${f.title}\n  Description: ${f.description}\n  Recommendations: ${(f.recommendations || []).join('; ')}`
    ).join('\n\n');

    return `You are an expert senior frontend engineer specializing in ${stackLabel} with ${stylingLabel}.

You have received the following UI/UX defect feedback from an AI design analysis tool for a web application:

--- FEEDBACK ITEMS ---
${feedbackSummary}
--- END OF FEEDBACK ---

Generate a comprehensive, enterprise-grade Frontend Fixing Guideline in strict JSON format.
Tech stack: ${stackLabel} | Styling: ${stylingLabel} | Component Library: ${componentLibrary !== 'none' ? componentLibrary : 'None'}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "executiveSummary": "2-3 sentences summarizing the overall UI quality and the fixing strategy",
  "issueBreakdown": [
    {
      "issueId": "feedback _id or index string",
      "title": "issue title",
      "severity": "high|medium|low",
      "category": "category name",
      "description": "clear description of the problem",
      "fixImplementation": "step-by-step instructions to fix this issue using ${stackLabel} and ${stylingLabel}",
      "codeSnippet": "relevant code snippet or CSS/Tailwind class example",
      "priority": 1
    }
  ],
  "priorityRoadmap": [
    {
      "phase": 1,
      "label": "Critical Fixes",
      "issues": ["issueId1", "issueId2"],
      "timeEstimate": "1-2 days"
    },
    {
      "phase": 2,
      "label": "Medium Priority Improvements",
      "issues": [],
      "timeEstimate": "2-3 days"
    },
    {
      "phase": 3,
      "label": "Low Priority Enhancements",
      "issues": [],
      "timeEstimate": "1 day"
    }
  ],
  "accessibilityFixes": [
    "WCAG-compliant fix description 1",
    "WCAG-compliant fix description 2"
  ],
  "technicalRecommendations": [
    "Framework-specific best practice recommendation",
    "Performance recommendation",
    "Maintainability recommendation"
  ]
}

Be specific, actionable, and use ${stackLabel} syntax and ${stylingLabel} patterns in all code examples.
Sort issueBreakdown by severity (high → medium → low).
Ensure priority values are integers starting from 1.`;
  }

  /**
   * Generate fixing guidelines using Gemini AI
   */
  async generateGuidelines({ feedbackItems, frontendStack, stylingLibrary, componentLibrary }) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 GuidelineService: Attempt ${attempt}/${maxRetries}`);

        const prompt = this.buildPrompt({ feedbackItems, frontendStack, stylingLibrary, componentLibrary });

        // 20-second timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini AI request timed out after 20 seconds')), 20000)
        );

        const generatePromise = this.model.generateContent(prompt);
        const result = await Promise.race([generatePromise, timeoutPromise]);

        const response = await result.response;
        const text = response.text().trim();

        // Parse JSON - strip possible markdown wrappers
        const cleanText = text
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();

        const parsed = JSON.parse(cleanText);
        this.validateGuidelineStructure(parsed);

        console.log(`✅ GuidelineService: Generated guidelines successfully on attempt ${attempt}`);
        return { success: true, guidelines: parsed };

      } catch (err) {
        lastError = err;
        console.warn(`⚠️ GuidelineService: Attempt ${attempt} failed: ${err.message}`);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }

    console.error('💥 GuidelineService: All retries exhausted', lastError);
    return {
      success: false,
      error: lastError.message,
      fallback: this.getFallbackGuidelines(feedbackItems)
    };
  }

  /**
   * Validate the parsed guideline JSON structure
   */
  validateGuidelineStructure(data) {
    if (typeof data.executiveSummary !== 'string') throw new Error('Missing executiveSummary');
    if (!Array.isArray(data.issueBreakdown)) throw new Error('issueBreakdown must be array');
    if (!Array.isArray(data.priorityRoadmap)) throw new Error('priorityRoadmap must be array');
    if (!Array.isArray(data.accessibilityFixes)) throw new Error('accessibilityFixes must be array');
    if (!Array.isArray(data.technicalRecommendations)) throw new Error('technicalRecommendations must be array');
  }

  /**
   * Fallback structure when AI fails
   */
  getFallbackGuidelines(feedbackItems) {
    return {
      executiveSummary: 'AI guideline generation encountered an issue. Below is a basic breakdown of identified issues.',
      issueBreakdown: feedbackItems.map((f, i) => ({
        issueId: f._id?.toString() || String(i),
        title: f.title,
        severity: f.severity,
        category: f.category,
        description: f.description,
        fixImplementation: 'Please review this issue manually and apply framework-appropriate fixes.',
        codeSnippet: '',
        priority: i + 1
      })),
      priorityRoadmap: [
        { phase: 1, label: 'All Issues', issues: feedbackItems.map(f => f._id?.toString() || ''), timeEstimate: 'TBD' }
      ],
      accessibilityFixes: ['Review all WCAG 2.1 AA guidelines for the identified accessibility issues.'],
      technicalRecommendations: ['Review each issue with the development team for framework-specific fixes.']
    };
  }
}

module.exports = new GuidelineService();
