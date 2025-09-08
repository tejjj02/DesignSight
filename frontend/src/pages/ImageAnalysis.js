import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { imageAPI } from '../utils/api';

const ImageAnalysis = () => {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const imageRef = useRef(null);
  const [analysis, setAnalysis] = useState(null);
  const [image, setImage] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [userRole, setUserRole] = useState('designer'); // Current user role
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    title: '',
    description: '',
    category: 'visual_hierarchy',
    severity: 'medium',
    coordinates: { x: 0, y: 0, width: 50, height: 50 }
  });
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [selectedFeedbackForComment, setSelectedFeedbackForComment] = useState(null);

  useEffect(() => {
    console.log('ImageAnalysis component mounted with imageId:', imageId);
    fetchAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      console.log('Fetching analysis for imageId:', imageId);
      const data = await imageAPI.getAnalysis(imageId);
      console.log('Analysis API response:', data);
      
      setImage(data.image);
      setFeedback(data.feedback);
      
      console.log('Image data set:', data.image);
      console.log('Feedback data set:', data.feedback);
      
      if (data.image.analysisData) {
        setAnalysis(data.image.analysisData);
        console.log('Analysis data set:', data.image.analysisData);
      }

      // Fetch comments for each feedback
      const feedbackComments = {};
      for (const feedbackItem of data.feedback) {
        try {
          const commentsData = await imageAPI.getFeedbackComments(feedbackItem._id);
          feedbackComments[feedbackItem._id] = commentsData.comments || [];
        } catch (error) {
          console.error('Error fetching comments for feedback:', feedbackItem._id, error);
          feedbackComments[feedbackItem._id] = [];
        }
      }
      setComments(feedbackComments);
    } catch (error) {
      setError('Failed to load analysis data');
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      
      const result = await imageAPI.analyzeImage(imageId, {
        role: userRole,
        focusAreas: ['layout', 'typography', 'color'],
        projectType: 'web-design'
      });

      if (result.success) {
        // Refresh the analysis data
        await fetchAnalysis();
      } else {
        setError('Analysis failed: ' + result.error);
      }
    } catch (error) {
      setError('Failed to start analysis: ' + error.message);
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const addUserFeedback = async () => {
    try {
      const feedbackData = {
        ...newFeedback,
        imageId,
        targetRoles: [userRole]
      };
      
      const result = await imageAPI.addFeedback(feedbackData);
      if (result.success) {
        setShowAddFeedback(false);
        setNewFeedback({
          title: '',
          description: '',
          category: 'visual_hierarchy',
          severity: 'medium',
          coordinates: { x: 0, y: 0, width: 50, height: 50 }
        });
        await fetchAnalysis(); // Refresh feedback
      }
    } catch (error) {
      console.error('Error adding feedback:', error);
      setError('Failed to add feedback');
    }
  };

  const addComment = async (feedbackId) => {
    if (!newComment.trim()) return;
    
    try {
      const result = await imageAPI.addComment({
        feedbackId,
        content: newComment,
        author: userRole
      });
      
      if (result.success) {
        setNewComment('');
        setSelectedFeedbackForComment(null);
        await fetchAnalysis(); // Refresh comments
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    }
  };

  const downloadFeedback = async (format) => {
    try {
      const feedbackData = {
        image: image,
        analysis: analysis,
        feedback: filteredFeedback,
        userRole: userRole,
        exportDate: new Date().toISOString()
      };

      if (format === 'json') {
        const dataStr = JSON.stringify(feedbackData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `feedback-${image?.originalName || 'analysis'}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        // Call backend API for PDF generation
        const response = await imageAPI.downloadFeedbackPDF(imageId, { 
          roleFilter,
          userRole 
        });
        
        // Create download link for PDF
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `feedback-${image?.originalName || 'analysis'}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading feedback:', error);
      setError('Failed to download feedback');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      high: 'border-red-500 bg-red-500',
      medium: 'border-yellow-500 bg-yellow-500',
      low: 'border-blue-500 bg-blue-500'
    };
    return colors[severity] || colors.medium;
  };

  const filteredFeedback = feedback.filter(item => {
    if (roleFilter === 'all') return true;
    return item.targetRoles && item.targetRoles.includes(roleFilter);
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--primary-bg)'}}>
      {/* Improved Header Layout */}
      <div className="shadow-sm border-b" style={{backgroundColor: 'var(--secondary-bg)', borderColor: 'var(--border-color)'}}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Top Row - Title and Back Button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-sm hover:opacity-75 transition-opacity text-accent flex-shrink-0"
              >
                ← Back to Project
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold truncate" style={{color: 'var(--text-primary)'}}>
                  {image?.originalName || 'Image Analysis'}
                </h1>
                <p className="text-xs truncate" style={{color: 'var(--text-muted)'}}>
                  Status: <span className={`font-medium ${
                    image?.analysisStatus === 'completed' ? 'text-green-600' :
                    image?.analysisStatus === 'processing' ? 'text-yellow-600' :
                    image?.analysisStatus === 'failed' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {image?.analysisStatus || 'Not analyzed'}
                  </span>
                </p>
              </div>
            </div>
            
            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowAddFeedback(true)}
                className="px-3 py-1 text-white rounded text-xs transition-all hover:transform hover:translateY(-1px)"
                style={{backgroundColor: 'var(--success-color)'}}
              >
                Add Feedback
              </button>

              {(!image?.analysisStatus || image?.analysisStatus === 'pending' || image?.analysisStatus === 'failed') && (
                <button
                  onClick={startAnalysis}
                  disabled={analyzing}
                  className="btn-primary px-3 py-1 text-xs disabled:opacity-50"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze'}
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row - Controls and Filters */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t" style={{borderColor: 'var(--border-color)'}}>
            <div className="flex items-center gap-3 text-sm">
              {/* User Role Selector */}
              <div className="flex items-center gap-1">
                <label className="text-xs" style={{color: 'var(--text-muted)'}}>Role:</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="border rounded px-4 py-2 text-xs align-left"
                  style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)'}}
                >
                  <option value="designer">Designer</option>
                  <option value="developer">Developer</option>
                  <option value="pm">PM</option>
                  <option value="reviewer">Reviewer</option>
                </select>
              </div>

              {/* Role Filter */}
              <div className="flex items-center gap-1 justify-start">
                <label className="text-xs text-left" style={{color: 'var(--text-muted)'}}>Filter:</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border rounded px-4 py-2 text-xs text-left "
                  style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)'}}
                >
                  <option value="all">All</option>
                  <option value="designer">Designer</option>
                  <option value="developer">Developer</option>
                  <option value="pm">PM</option>
                  <option value="reviewer">Reviewer</option>
                </select>
              </div>
            </div>

            {/* Download Options */}
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{color: 'var(--text-muted)'}}>Export:</span>
              <button
                onClick={() => downloadFeedback('json')}
                className="btn-secondary px-2 py-1 text-xs"
              >
                JSON
              </button>
              <button
                onClick={() => downloadFeedback('pdf')}
                className="btn-secondary px-2 py-1 text-xs"
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
          {/* Image Display - Takes more space */}
          <div className="xl:col-span-3">
            <div className="rounded-lg shadow-accent h-full flex flex-col card-hover" style={{backgroundColor: 'var(--secondary-bg)'}}>
              {/* Image Header */}
              {image && (
                <div className="px-4 py-2 border-b rounded-t-lg" style={{backgroundColor: 'var(--accent-light)', borderColor: 'var(--border-color)'}}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium truncate" style={{color: 'var(--text-primary)'}}>
                        {image.originalName}
                      </h3>
                      <p className="text-xs" style={{color: 'var(--text-muted)'}}>
                        {image.metadata?.width}×{image.metadata?.height}px
                      </p>
                    </div>
                    <div className="text-xs" style={{color: 'var(--text-muted)'}}>
                      ID: {image._id?.slice(-8)}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Image Container */}
              <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                {image ? (
                  <div className="relative max-w-full max-h-full">
                    <img
                      ref={imageRef}
                      src={imageAPI.getImageFileUrl(image._id)}
                      alt={image.originalName}
                      className="max-w-full max-h-full object-contain rounded"
                      style={{ maxHeight: 'calc(100vh - 200px)' }}
                      onLoad={() => console.log('Image loaded successfully')}
                      onError={(e) => {
                        console.error('Image failed to load:', e);
                        console.error('Image URL:', imageAPI.getImageFileUrl(image._id));
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded h-96 w-full" style={{backgroundColor: 'var(--accent-light)'}}>
                    <p style={{color: 'var(--text-muted)'}}>Loading image...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback Panel - Compact sidebar */}
          <div className="xl:col-span-1">
            <div className="rounded-lg shadow-accent h-full flex flex-col card-hover" style={{backgroundColor: 'var(--secondary-bg)'}}>
              {/* Panel Header */}
              <div className="px-4 py-3 border-b rounded-t-lg" style={{backgroundColor: 'var(--accent-light)', borderColor: 'var(--border-color)'}}>
                <h3 className="text-sm font-semibold" style={{color: 'var(--text-primary)'}}>
                  Feedback ({filteredFeedback.length})
                </h3>
                <p className="text-xs" style={{color: 'var(--text-muted)'}}>
                  {roleFilter === 'all' ? 'All Roles' : roleFilter}
                </p>
              </div>

              {/* Overall Analysis - Compact */}
              {analysis?.overallAnalysis && (
                <div className="px-4 py-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium" style={{color: 'var(--text-secondary)'}}>Score</span>
                    <span className="text-lg font-bold text-accent">
                      {analysis.overallAnalysis.score}/100
                    </span>
                  </div>
                  <div className="w-full rounded-full h-1.5 mb-2" style={{backgroundColor: 'var(--border-color)'}}>
                    <div 
                      className="h-1.5 rounded-full bg-accent" 
                      style={{ width: `${analysis.overallAnalysis.score}%` }}
                    ></div>
                  </div>
                  <p className="text-xs line-clamp-3" style={{color: 'var(--text-secondary)'}}>
                    {analysis.overallAnalysis.summary}
                  </p>
                </div>
              )}

              {/* Feedback List - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-3">
                  {filteredFeedback.map((feedbackItem, index) => (
                    <div
                      key={feedbackItem._id}
                      className="border rounded-lg p-3 card-hover transition-all"
                      style={{backgroundColor: 'var(--accent-light)', borderColor: 'var(--border-color)'}}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-5 h-5 rounded-full ${getSeverityColor(feedbackItem.severity)} text-white text-xs flex items-center justify-center font-bold flex-shrink-0`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium line-clamp-2" style={{color: 'var(--text-primary)'}}>
                            {feedbackItem.title}
                          </h4>
                          <p className="text-xs mt-1 line-clamp-3" style={{color: 'var(--text-secondary)'}}>
                            {feedbackItem.description}
                          </p>
                          
                          {/* Compact Metadata */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                              feedbackItem.severity === 'high' ? 'bg-red-100 text-red-700' :
                              feedbackItem.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {feedbackItem.severity}
                            </span>
                            <span className="text-xs px-1 py-0.5 rounded" style={{color: 'var(--text-muted)', backgroundColor: 'var(--secondary-bg)'}}>
                              {feedbackItem.category?.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Coordinates */}
                          {feedbackItem.coordinates && (
                            <div className="text-xs mt-1" style={{color: 'var(--text-muted)'}}>
                              @({feedbackItem.coordinates.x},{feedbackItem.coordinates.y})
                            </div>
                          )}

                          {/* Recommendations - Collapsible */}
                          {feedbackItem.recommendations && feedbackItem.recommendations.length > 0 && (
                            <div className="mt-2 p-2 rounded text-xs" style={{backgroundColor: 'var(--secondary-bg)'}}>
                              <div className="font-medium mb-1 text-accent">Recommendations:</div>
                              <ul className="list-disc list-inside space-y-1">
                                {feedbackItem.recommendations.slice(0, 2).map((rec, idx) => (
                                  <li key={idx} className="line-clamp-2" style={{color: 'var(--text-secondary)'}}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Comments Section - Compact */}
                          <div className="mt-2 border-t pt-2" style={{borderColor: 'var(--border-color)'}}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs" style={{color: 'var(--text-secondary)'}}>
                                {comments[feedbackItem._id]?.length || 0} comments
                              </span>
                              <button
                                onClick={() => setSelectedFeedbackForComment(
                                  selectedFeedbackForComment === feedbackItem._id ? null : feedbackItem._id
                                )}
                                className="text-xs hover:opacity-75 transition-opacity text-accent"
                              >
                                {selectedFeedbackForComment === feedbackItem._id ? '×' : '+'}
                              </button>
                            </div>

                            {/* Existing Comments - Compact */}
                            {comments[feedbackItem._id] && comments[feedbackItem._id].length > 0 && (
                              <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                                {comments[feedbackItem._id].slice(0, 3).map((comment, idx) => (
                                  <div key={idx} className="text-xs p-1.5 rounded" style={{backgroundColor: 'var(--secondary-bg)'}}>
                                    <div className="font-medium" style={{color: 'var(--text-primary)'}}>{comment.author}</div>
                                    <p className="line-clamp-2" style={{color: 'var(--text-secondary)'}}>{comment.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Comment Form - Compact */}
                            {selectedFeedbackForComment === feedbackItem._id && (
                              <div className="mt-2">
                                <textarea
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Add comment..."
                                  className="w-full text-xs border rounded p-1.5"
                                  style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)'}}
                                  rows="2"
                                />
                                <div className="flex justify-end gap-1 mt-1">
                                  <button
                                    onClick={() => setSelectedFeedbackForComment(null)}
                                    className="px-2 py-1 text-xs hover:opacity-75 transition-opacity"
                                    style={{color: 'var(--text-secondary)'}}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => addComment(feedbackItem._id)}
                                    className="px-2 py-1 text-xs text-white rounded hover:opacity-90 transition-opacity"
                                    style={{backgroundColor: 'var(--accent-bg)'}}
                                  >
                                    Post
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredFeedback.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs" style={{color: 'var(--text-muted)'}}>No feedback for selected filter</p>
                      {!image?.analysisStatus && (
                        <p className="text-xs mt-1" style={{color: 'var(--text-muted)'}}>Click "Analyze" to generate AI feedback</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Feedback Modal */}
      {showAddFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-lg p-6 w-full max-w-md" style={{backgroundColor: 'var(--secondary-bg)'}}>
            <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Add New Feedback</h3>
            
            <form onSubmit={(e) => { e.preventDefault(); addUserFeedback(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>Title</label>
                  <input
                    type="text"
                    value={newFeedback.title}
                    onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)'}}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>Description</label>
                  <textarea
                    value={newFeedback.description}
                    onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)'}}
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>Category</label>
                    <select
                      value={newFeedback.category}
                      onChange={(e) => setNewFeedback({ ...newFeedback, category: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)'}}
                    >
                      <option value="visual_hierarchy">Visual Hierarchy</option>
                      <option value="accessibility">Accessibility</option>
                      <option value="content">Content</option>
                      <option value="ux_patterns">UX Patterns</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>Severity</label>
                    <select
                      value={newFeedback.severity}
                      onChange={(e) => setNewFeedback({ ...newFeedback, severity: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)'}}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>Coordinates (Optional)</label>
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="number"
                      placeholder="X"
                      value={newFeedback.coordinates.x}
                      onChange={(e) => setNewFeedback({ 
                        ...newFeedback, 
                        coordinates: { ...newFeedback.coordinates, x: parseInt(e.target.value) || 0 }
                      })}
                      className="border rounded px-2 py-1 text-sm"
                      style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)'}}
                    />
                    <input
                      type="number"
                      placeholder="Y"
                      value={newFeedback.coordinates.y}
                      onChange={(e) => setNewFeedback({ 
                        ...newFeedback, 
                        coordinates: { ...newFeedback.coordinates, y: parseInt(e.target.value) || 0 }
                      })}
                      className="border rounded px-2 py-1 text-sm"
                      style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)'}}
                    />
                    <input
                      type="number"
                      placeholder="Width"
                      value={newFeedback.coordinates.width}
                      onChange={(e) => setNewFeedback({ 
                        ...newFeedback, 
                        coordinates: { ...newFeedback.coordinates, width: parseInt(e.target.value) || 50 }
                      })}
                      className="border rounded px-2 py-1 text-sm"
                      style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)'}}
                    />
                    <input
                      type="number"
                      placeholder="Height"
                      value={newFeedback.coordinates.height}
                      onChange={(e) => setNewFeedback({ 
                        ...newFeedback, 
                        coordinates: { ...newFeedback.coordinates, height: parseInt(e.target.value) || 50 }
                      })}
                      className="border rounded px-2 py-1 text-sm"
                      style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)'}}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddFeedback(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Add Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnalysis;
