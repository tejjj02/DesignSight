/**
 * GeminiPromptBuilder — Builds structured prompts for the AI Fixing Guideline Generator.
 * Converts stored UI/UX feedback into implementation-ready Gemini prompts.
 */

class GeminiPromptBuilder {
  /**
   * Build a comprehensive guideline generation prompt from feedback + tech stack details.
   * @param {Array} feedbackItems - Stored feedback from MongoDB
   * @param {Object} techStack - { frontendStack, stylingLibrary, componentLibrary }
   * @returns {string} Structured Gemini prompt
   */
  buildGuidelinePrompt(feedbackItems, techStack) {
    const { frontendStack, stylingLibrary, componentLibrary } = techStack;

    // Group feedback by category and severity for better prompt structure
    const groupedFeedback = this.groupFeedbackByCategoryAndSeverity(feedbackItems);

    const feedbackSummary = this.formatFeedbackForPrompt(feedbackItems);

    return `You are a senior frontend engineering consultant specializing in ${frontendStack} development.

You have been given a list of UI/UX design feedback items discovered through AI analysis of a UI screenshot.
Your task is to generate a comprehensive, implementation-ready frontend remediation roadmap.

## Tech Stack Context
- **Frontend Framework**: ${frontendStack}
- **Styling Library**: ${stylingLibrary}
- **Component Library**: ${componentLibrary || 'None'}

## UI/UX Feedback Items (${feedbackItems.length} total)
${feedbackSummary}

## Feedback Summary by Category
${this.formatGroupedFeedback(groupedFeedback)}

## Your Task
Generate a detailed engineering remediation roadmap as a JSON object with this exact structure:

{
  "executiveSummary": {
    "totalIssues": <number>,
    "criticalCount": <number>,
    "overview": "<2-3 sentence summary of the UI state and remediation scope>",
    "estimatedEffort": "<e.g., '3-5 days for a single developer'>"
  },
  "priorityRoadmap": [
    {
      "priority": 1,
      "phase": "<Sprint 1 / Day 1-2>",
      "title": "<Phase title>",
      "description": "<What to fix in this phase>",
      "issues": ["<issue title 1>", "<issue title 2>"],
      "estimatedHours": <number>
    }
  ],
  "componentFixes": [
    {
      "component": "<Component name e.g. NavigationBar, HeroSection>",
      "issue": "<Description of the issue>",
      "severity": "<high|medium|low>",
      "category": "<accessibility|visual_hierarchy|content|ux_patterns>",
      "implementation": {
        "description": "<Detailed implementation instructions>",
        "codeExample": "<${frontendStack} code snippet using ${stylingLibrary}${componentLibrary !== 'None' ? ' and ' + componentLibrary : ''}>",
        "bestPractices": ["<practice 1>", "<practice 2>"]
      }
    }
  ],
  "accessibilityFixes": [
    {
      "wcagGuideline": "<e.g., WCAG 2.1 AA - 1.4.3 Contrast>",
      "issue": "<Description>",
      "implementation": "<Code fix or implementation instructions>",
      "priority": "<high|medium|low>"
    }
  ],
  "responsiveFixes": [
    {
      "breakpoint": "<mobile|tablet|desktop>",
      "issue": "<Description>",
      "implementation": "<Implementation using ${stylingLibrary}>",
      "priority": "<high|medium|low>"
    }
  ],
  "refactoringRecommendations": [
    {
      "title": "<Refactoring suggestion title>",
      "rationale": "<Why this refactoring improves the codebase>",
      "implementation": "<How to implement it in ${frontendStack}>",
      "impact": "<high|medium|low>"
    }
  ],
  "technicalDebtNotes": [
    "<Technical debt note 1>",
    "<Technical debt note 2>"
  ],
  "testingRecommendations": [
    {
      "testType": "<unit|integration|e2e|accessibility>",
      "description": "<What to test>",
      "tool": "<Jest|Playwright|axe-core|etc.>"
    }
  ]
}

## Engineering Standards Requirements
- Use ${frontendStack}-specific patterns and best practices
- All code examples must use ${stylingLibrary} for styling
${componentLibrary !== 'None' ? `- Use ${componentLibrary} components where applicable` : '- Use custom components'}
- Follow WCAG 2.1 AA accessibility guidelines
- Include responsive design patterns
- Prioritize issues by severity: high → medium → low
- Provide actionable, copy-paste-ready code examples

Return ONLY the JSON object. No markdown formatting, no code blocks, no additional text.`;
  }

  /**
   * Group feedback items by category and severity
   * @param {Array} feedbackItems
   * @returns {Object} Grouped feedback
   */
  groupFeedbackByCategoryAndSeverity(feedbackItems) {
    const grouped = {};
    feedbackItems.forEach(item => {
      const key = item.category || 'general';
      if (!grouped[key]) grouped[key] = { high: [], medium: [], low: [] };
      const sev = item.severity || 'low';
      if (grouped[key][sev]) grouped[key][sev].push(item);
    });
    return grouped;
  }

  /**
   * Format all feedback items into a readable prompt section
   * @param {Array} feedbackItems
   * @returns {string}
   */
  formatFeedbackForPrompt(feedbackItems) {
    if (!feedbackItems || feedbackItems.length === 0) {
      return 'No feedback items available.';
    }

    return feedbackItems.map((item, index) => {
      const recs = item.recommendations && item.recommendations.length > 0
        ? `\n  Recommendations: ${item.recommendations.join('; ')}`
        : '';
      return `${index + 1}. [${(item.severity || 'low').toUpperCase()}] ${item.title}
  Category: ${item.category || 'general'}
  Description: ${item.description || 'No description provided'}${recs}`;
    }).join('\n\n');
  }

  /**
   * Format grouped feedback into a compact summary
   * @param {Object} grouped
   * @returns {string}
   */
  formatGroupedFeedback(grouped) {
    return Object.entries(grouped).map(([category, bySeverity]) => {
      const total = (bySeverity.high?.length || 0) + (bySeverity.medium?.length || 0) + (bySeverity.low?.length || 0);
      return `- ${category.replace('_', ' ')} (${total}): ${bySeverity.high?.length || 0} high, ${bySeverity.medium?.length || 0} medium, ${bySeverity.low?.length || 0} low`;
    }).join('\n');
  }

  /**
   * Build a sanitized version of the prompt (removes any user-injected scripts)
   * @param {Array} feedbackItems
   * @param {Object} techStack
   * @returns {string} Sanitized prompt
   */
  buildSanitizedPrompt(feedbackItems, techStack) {
    // Sanitize tech stack inputs
    const sanitizedStack = {
      frontendStack: this.sanitizeInput(techStack.frontendStack),
      stylingLibrary: this.sanitizeInput(techStack.stylingLibrary),
      componentLibrary: this.sanitizeInput(techStack.componentLibrary)
    };

    // Sanitize feedback items
    const sanitizedFeedback = feedbackItems.map(item => ({
      ...item,
      title: this.sanitizeInput(item.title),
      description: this.sanitizeInput(item.description),
      category: item.category,
      severity: item.severity
    }));

    return this.buildGuidelinePrompt(sanitizedFeedback, sanitizedStack);
  }

  /**
   * Basic input sanitization
   * @param {string} input
   * @returns {string}
   */
  sanitizeInput(input) {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim()
      .substring(0, 500); // Limit length
  }
}

module.exports = new GeminiPromptBuilder();
