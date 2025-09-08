import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Project API calls
export const projectAPI = {
  // Get all projects
  getAllProjects: async () => {
    try {
      const response = await api.get('/projects');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  // Create new project
  createProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Get specific project
  getProject: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },

  // Update project
  updateProject: async (projectId, projectData) => {
    try {
      const response = await api.put(`/projects/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Delete project
  deleteProject: async (projectId) => {
    try {
      const response = await api.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }
};

// Image API calls
export const imageAPI = {
  // Upload image to project
  uploadImage: async (formData) => {
    try {
      const response = await api.post('/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Get all images
  getAllImages: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/images?${params}`);
      // Extract the data array from the response
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  },

  // Get specific image
  getImage: async (imageId) => {
    try {
      const response = await api.get(`/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching image:', error);
      throw error;
    }
  },

  // Get image file URL
  getImageFileUrl: (imageId) => {
    return `${API_BASE_URL}/images/${imageId}/file`;
  },

  // Analyze image with AI
  analyzeImage: async (imageId, options = {}) => {
    try {
      const response = await api.post(`/images/${imageId}/analyze`, options);
      return response.data;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  },

  // Get analysis results
  getAnalysis: async (imageId) => {
    try {
      const response = await api.get(`/images/${imageId}/analysis`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analysis:', error);
      throw error;
    }
  },

  // Add user feedback
  addFeedback: async (feedbackData) => {
    try {
      const response = await api.post('/feedback', feedbackData);
      return response.data;
    } catch (error) {
      console.error('Error adding feedback:', error);
      throw error;
    }
  },

  // Get comments for feedback
  getFeedbackComments: async (feedbackId) => {
    try {
      const response = await api.get(`/feedback/${feedbackId}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  // Add comment to feedback
  addComment: async (commentData) => {
    try {
      const response = await api.post('/comments', commentData);
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Download feedback as PDF
  downloadFeedbackPDF: async (imageId, filters = {}) => {
    try {
      const response = await api.get(`/images/${imageId}/download/pdf`, {
        params: filters,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default api;
