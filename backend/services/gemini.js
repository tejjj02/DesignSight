const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Analyze design image using Gemini AI
   * @param {string} imagePath - Path to the image file
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results with coordinate-anchored feedback
   */
  async analyzeDesign(imagePath, options = {}) {
    try {
      console.log('🧠 GeminiService: Starting analysis for:', imagePath);
      console.log('🛠️ GeminiService: Options:', options);
      
      // Read image file
      console.log('📖 GeminiService: Reading image file...');
      const imageBuffer = fs.readFileSync(imagePath);
      console.log(`📊 GeminiService: Image buffer size: ${imageBuffer.length} bytes`);
      
      const imageData = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: this.getMimeType(imagePath)
        }
      };
      console.log(`🖼️ GeminiService: Image MIME type: ${imageData.inlineData.mimeType}`);

      // Generate structured prompt for design analysis
      console.log('📝 GeminiService: Generating prompt...');
      const prompt = this.generateDesignAnalysisPrompt(options);
      console.log(`📄 GeminiService: Prompt length: ${prompt.length} characters`);

      // Call Gemini API
      console.log('🚀 GeminiService: Calling Gemini API...');
      const result = await this.model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
      console.log(`📨 GeminiService: Received response, length: ${text.length} characters`);

      // Parse and structure the response
      console.log('🔍 GeminiService: Parsing response...');
      const parsedResult = this.parseAnalysisResponse(text);
      console.log('✅ GeminiService: Analysis completed successfully');
      return parsedResult;
    } catch (error) {
      console.error('💥 GeminiService: Analysis error:', error);
      console.error('📍 GeminiService: Error stack:', error.stack);
      
      // Return a structured error response
      return {
        success: false,
        error: error.message,
        fallback: {
          overview: 'Analysis failed due to technical issues. Please try again.',
          scores: { layout: 0, color: 0, typography: 0, usability: 0, accessibility: 0 },
          coordinateFeedback: [],
          suggestions: ['Please try uploading the image again', 'Ensure the image is a valid design file']
        }
      };
    }
  }

  /**
   * Generate structured prompt for design analysis
   * @param {Object} options - Analysis options (role, focus areas, etc.)
   * @returns {string} Formatted prompt
   */
  generateDesignAnalysisPrompt(options = {}) {
    const { role = 'designer', focusAreas = [], projectType = 'general' } = options;

    return `You are an expert design critic analyzing a ${projectType} design. 
Provide coordinate-anchored feedback in the following JSON format:

{
  "overallAnalysis": {
    "summary": "Brief overall assessment",
    "score": 85,
    "strengths": ["list", "of", "strengths"],
    "improvements": ["list", "of", "improvements"]
  },
  "coordinateFeedback": [
    {
      "x": 150,
      "y": 200,
      "width": 100,
      "height": 50,
      "category": "layout|typography|color|spacing|accessibility|branding",
      "severity": "high|medium|low",
      "title": "Issue or suggestion title",
      "description": "Detailed explanation",
      "suggestion": "Specific improvement suggestion",
      "targetRole": "designer|client|stakeholder|all"
    }
  ],
  "designPrinciples": {
    "balance": {"score": 8, "notes": "explanation"},
    "contrast": {"score": 7, "notes": "explanation"},
    "hierarchy": {"score": 9, "notes": "explanation"},
    "alignment": {"score": 6, "notes": "explanation"},
    "proximity": {"score": 8, "notes": "explanation"},
    "repetition": {"score": 7, "notes": "explanation"}
  }
}

Analysis focus for ${role} role:
${this.getRoleSpecificGuidance(role)}

${focusAreas.length > 0 ? `Special attention to: ${focusAreas.join(', ')}` : ''}

Provide specific pixel coordinates for each feedback point. Be precise and actionable.
Return only valid JSON without any markdown formatting or code blocks.`;
  }

  /**
   * Get role-specific analysis guidance
   * @param {string} role - User role (designer, client, stakeholder)
   * @returns {string} Role-specific guidance
   */
  getRoleSpecificGuidance(role) {
    const guidance = {
      designer: `
- Focus on technical design principles, typography, spacing, and professional best practices
- Identify areas for improvement in visual hierarchy and user experience
- Suggest specific design solutions and alternatives`,
      
      client: `
- Focus on brand alignment, message clarity, and business objectives
- Assess if the design meets project requirements and target audience needs
- Provide feedback in business-friendly language`,
      
      stakeholder: `
- Evaluate overall impact, accessibility, and user experience
- Consider strategic alignment and market positioning
- Focus on high-level observations and suggestions`
    };

    return guidance[role] || guidance.designer;
  }

  /**
   * Parse Gemini response into structured format
   * @param {string} responseText - Raw response from Gemini
   * @returns {Object} Parsed analysis results
   */
  parseAnalysisResponse(responseText) {
    try {
      // Clean the response text
      let cleanText = responseText.trim();
      
      // Remove markdown code blocks if present
      cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      // Parse JSON
      const analysis = JSON.parse(cleanText);
      
      // Validate structure
      this.validateAnalysisStructure(analysis);
      
      return {
        success: true,
        analysis,
        timestamp: new Date(),
        model: 'gemini-1.5-flash'
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.error('Raw response:', responseText);
      
      // Return fallback structure
      return {
        success: false,
        error: 'Failed to parse AI response',
        fallback: this.getFallbackAnalysis(),
        rawResponse: responseText,
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate analysis structure
   * @param {Object} analysis - Parsed analysis object
   */
  validateAnalysisStructure(analysis) {
    if (!analysis.overallAnalysis) {
      throw new Error('Missing overallAnalysis in response');
    }
    
    if (!Array.isArray(analysis.coordinateFeedback)) {
      throw new Error('coordinateFeedback must be an array');
    }
    
    // Validate coordinate feedback structure
    analysis.coordinateFeedback.forEach((feedback, index) => {
      const required = ['x', 'y', 'category', 'severity', 'title', 'description'];
      required.forEach(field => {
        if (!(field in feedback)) {
          throw new Error(`Missing ${field} in feedback item ${index}`);
        }
      });
      
      // Validate coordinate values
      if (typeof feedback.x !== 'number' || typeof feedback.y !== 'number') {
        throw new Error(`Invalid coordinates in feedback item ${index}`);
      }
    });
  }

  /**
   * Get fallback analysis structure when parsing fails
   * @returns {Object} Fallback analysis
   */
  getFallbackAnalysis() {
    return {
      overallAnalysis: {
        summary: "Analysis completed with limited results",
        score: 75,
        strengths: ["Design uploaded successfully"],
        improvements: ["AI analysis needs review"]
      },
      coordinateFeedback: [],
      designPrinciples: {
        balance: { score: 7, notes: "Requires manual review" },
        contrast: { score: 7, notes: "Requires manual review" },
        hierarchy: { score: 7, notes: "Requires manual review" },
        alignment: { score: 7, notes: "Requires manual review" },
        proximity: { score: 7, notes: "Requires manual review" },
        repetition: { score: 7, notes: "Requires manual review" }
      }
    };
  }

  /**
   * Get MIME type for image file
   * @param {string} filePath - Path to image file
   * @returns {string} MIME type
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp'
    };
    
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Test Gemini API connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      const result = await this.model.generateContent('Hello, test connection');
      const response = await result.response;
      return response.text().length > 0;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}

module.exports = new GeminiService();
