import { useState, useEffect } from 'react';
import { imageAPI } from '../utils/api';

export function useImageAnalysis(imageId) {
  const [image, setImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [userRole, setUserRole] = useState('designer');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newFb, setNewFb] = useState({
    title: '', description: '', category: 'visual_hierarchy', severity: 'medium',
    coordinates: { x: 0, y: 0, width: 50, height: 50 },
  });

  useEffect(() => {
    if (imageId) {
      fetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const data = await imageAPI.getAnalysis(imageId);
      setImage(data.image);
      setFeedback(data.feedback || []);
      if (data.image.analysisData) setAnalysis(data.image.analysisData);

      const cmtMap = {};
      for (const fb of data.feedback || []) {
        try {
          const r = await imageAPI.getFeedbackComments(fb._id);
          cmtMap[fb._id] = r.data || []; // Note: Ensure it reads data field if updated backend format
        } catch { cmtMap[fb._id] = []; }
      }
      setComments(cmtMap);
    } catch { 
      setError('Failed to load analysis'); 
    } finally { 
      setLoading(false); 
    }
  };

  const startAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await imageAPI.analyzeImage(imageId, {
        role: userRole, focusAreas: ['layout', 'typography', 'color'], projectType: 'web-design',
      });
      if (res.success) await fetchAll();
      else setError('Analysis failed: ' + res.error);
    } catch (e) { setError('Failed: ' + e.message); }
    finally { setAnalyzing(false); }
  };

  const addFeedback = async () => {
    const res = await imageAPI.addFeedback({ ...newFb, imageId, targetRoles: [userRole] });
    if (res.success) {
      setShowAdd(false);
      setNewFb({ title: '', description: '', category: 'visual_hierarchy', severity: 'medium',
        coordinates: { x: 0, y: 0, width: 50, height: 50 } });
      await fetchAll();
    }
  };

  const addComment = async (fbId, content) => {
    await imageAPI.addComment({ feedbackId: fbId, content, author: { name: 'User', role: userRole } });
    await fetchAll();
  };

  const downloadJSON = () => {
    const data = { image, analysis, feedback: filteredFeedback, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `feedback-${image?.originalName || 'analysis'}.json`;
    a.click();
  };

  const downloadPDF = async () => {
    try {
      const blob = await imageAPI.downloadFeedbackPDF(imageId);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      a.download = `feedback-${image?.originalName || 'analysis'}.pdf`;
      a.click();
    } catch (err) {
      console.error('Error downloading PDF', err);
    }
  };

  const filteredFeedback = feedback.filter(fb =>
    roleFilter === 'all' || (fb.targetRoles && fb.targetRoles.includes(roleFilter))
  );

  return {
    image,
    analysis,
    feedback,
    comments,
    loading,
    analyzing,
    error,
    roleFilter,
    setRoleFilter,
    userRole,
    setUserRole,
    selected,
    setSelected,
    showAdd,
    setShowAdd,
    newFb,
    setNewFb,
    filteredFeedback,
    fetchAll,
    startAnalysis,
    addFeedback,
    addComment,
    downloadJSON,
    downloadPDF
  };
}
