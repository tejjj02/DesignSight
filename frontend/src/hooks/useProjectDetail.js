import { useState, useEffect } from 'react';
import { projectAPI, imageAPI } from '../utils/api';

export function useProjectDetail(projectId) {
  const [project, setProject] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState({});

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await projectAPI.getProject(projectId);
      setProject(res.data);
    } catch {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const data = await imageAPI.getAllImages({ projectId });
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching images:', err);
    }
  };

  const handleAnalyze = async (imageId) => {
    try {
      setAnalyzingIds(prev => ({ ...prev, [imageId]: true }));
      setImages(prev => prev.map(img => img._id === imageId ? { ...img, analysisStatus: 'processing' } : img));
      
      await imageAPI.analyzeImage(imageId, {
        role: 'designer',
        focusAreas: ['layout', 'typography', 'color'],
        projectType: 'web-design',
      });
      await fetchImages();
    } catch (err) {
      console.error('Analysis failed:', err);
      setImages(prev => prev.map(img => img._id === imageId ? { ...img, analysisStatus: 'failed' } : img));
    } finally {
      setAnalyzingIds(prev => {
        const next = { ...prev };
        delete next[imageId];
        return next;
      });
    }
  };

  return {
    project,
    images,
    loading,
    error,
    showUpload,
    setShowUpload,
    analyzingIds,
    fetchImages,
    handleAnalyze
  };
}
