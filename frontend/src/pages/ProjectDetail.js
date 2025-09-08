import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, imageAPI } from '../utils/api';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchImages();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getProject(id);
      setProject(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch project');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const data = await imageAPI.getAllImages({ projectId: id });
      setImages(data);
      console.log('Fetched images for project:', data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setUploadFile(file);
    } else {
      alert('Please select an image file');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', uploadFile);
      formData.append('projectId', id);

      const response = await imageAPI.uploadImage(formData);
      console.log('Upload successful:', response);
      
      // Refresh images list
      await fetchImages();
      
      // Close modal and reset form
      setShowUploadModal(false);
      setUploadFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <p style={{color: 'var(--text-muted)'}}>Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-4" style={{backgroundColor: 'var(--accent-light)', borderColor: 'var(--error-color)'}}>
        <p style={{color: 'var(--error-color)'}}>{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-2 underline hover:opacity-75 transition-opacity"
          style={{color: 'var(--error-color)'}}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p style={{color: 'var(--text-muted)'}}>Project not found</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 btn-primary"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button 
            onClick={() => navigate('/')}
            className="text-sm mb-2 hover:opacity-75 transition-opacity text-accent"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold gradient-text">{project.name}</h1>
          {project.description && (
            <p className="mt-1" style={{color: 'var(--text-secondary)'}}>{project.description}</p>
          )}
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 text-white rounded-lg transition-all hover:transform hover:translateY(-1px)"
          style={{backgroundColor: 'var(--success-color)'}}
        >
          Upload Image
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stats-card card-hover p-6">
          <h3 className="text-lg font-semibold" style={{color: 'var(--text-primary)'}}>Total Images</h3>
          <p className="text-3xl font-bold text-accent mt-2">
            {project.images?.length || 0}
          </p>
        </div>
        <div className="stats-card card-hover p-6">
          <h3 className="text-lg font-semibold" style={{color: 'var(--text-primary)'}}>Analyzed</h3>
          <p className="text-3xl font-bold mt-2" style={{color: 'var(--success-color)'}}>0</p>
        </div>
        <div className="stats-card card-hover p-6">
          <h3 className="text-lg font-semibold" style={{color: 'var(--text-primary)'}}>Feedback Items</h3>
          <p className="text-3xl font-bold mt-2" style={{color: 'var(--info-color)'}}>0</p>
        </div>
      </div>

      <div className="rounded-lg shadow-accent card-hover" style={{backgroundColor: 'var(--secondary-bg)'}}>
        <div className="p-6 border-b" style={{borderColor: 'var(--border-color)'}}>
          <h2 className="text-xl font-semibold" style={{color: 'var(--text-primary)'}}>Project Images</h2>
        </div>
        <div className="p-6">
          {images && images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div key={image._id || index} className="border rounded-lg p-4 card-hover" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)'}}>
                  <div className="rounded-lg h-48 flex items-center justify-center mb-3" style={{backgroundColor: 'var(--accent-light)'}}>
                    <img 
                      src={imageAPI.getImageFileUrl(image._id)} 
                      alt={image.originalName}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <span className="hidden" style={{color: 'var(--text-muted)'}}>Image Preview</span>
                  </div>
                  <h3 className="font-medium" style={{color: 'var(--text-primary)'}}>{image.originalName || `Image ${index + 1}`}</h3>
                  <p className="text-sm" style={{color: 'var(--text-muted)'}}>
                    Status: {image.analysisStatus || 'Pending'}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => navigate(`/images/${image._id}/analysis`)}
                      className="flex-1 btn-primary text-sm"
                    >
                      Analyze Design
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12" style={{color: 'var(--text-muted)'}} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="mt-2 text-sm font-medium" style={{color: 'var(--text-primary)'}}>No images yet</h3>
              <p className="mt-1 text-sm" style={{color: 'var(--text-muted)'}}>Upload your first design image to start getting AI feedback.</p>
              <div className="mt-6">
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 text-white rounded-lg transition-all hover:transform hover:translateY(-1px)"
                  style={{backgroundColor: 'var(--success-color)'}}
                >
                  Upload Image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="rounded-lg max-w-md w-full p-6" style={{backgroundColor: 'var(--secondary-bg)'}}>
            <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Upload Design Image</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>
                  Select Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                  style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)', focusRingColor: 'var(--accent-bg)'}}
                />
                {uploadFile && (
                  <p className="text-sm mt-1" style={{color: 'var(--text-secondary)'}}>Selected: {uploadFile.name}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                className="btn-secondary"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="px-4 py-2 text-white rounded-lg disabled:opacity-50 transition-all hover:transform hover:translateY(-1px)"
                style={{backgroundColor: 'var(--success-color)'}}
              >
                {uploading ? 'Uploading...' : 'Upload & Analyze'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
