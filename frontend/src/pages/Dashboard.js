import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getAllProjects();
      setProjects(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch projects');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      alert('Project name is required');
      return;
    }

    try {
      await projectAPI.createProject(newProject);
      setNewProject({ name: '', description: '' });
      setShowCreateModal(false);
      fetchProjects(); // Refresh the list
    } catch (err) {
      alert('Failed to create project');
      console.error('Error:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          New Project
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stats-card card-hover p-6">
          <h3 className="text-lg font-semibold" style={{color: 'var(--text-primary)'}}>Total Projects</h3>
          <p className="text-3xl font-bold text-accent mt-2">
            {loading ? '...' : projects.length}
          </p>
        </div>
        <div className="stats-card card-hover p-6">
          <h3 className="text-lg font-semibold" style={{color: 'var(--text-primary)'}}>Images Analyzed</h3>
          <p className="text-3xl font-bold mt-2" style={{color: 'var(--success-color)'}}>
            {loading ? '...' : projects.reduce((total, project) => total + (project.images?.length || 0), 0)}
          </p>
        </div>
        <div className="stats-card card-hover p-6">
          <h3 className="text-lg font-semibold" style={{color: 'var(--text-primary)'}}>Total Feedback</h3>
          <p className="text-3xl font-bold mt-2" style={{color: 'var(--info-color)'}}>0</p>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 rounded-lg p-4" style={{backgroundColor: 'var(--accent-light)', borderColor: 'var(--error-color)'}}>
          <p style={{color: 'var(--error-color)'}}>{error}</p>
          <button 
            onClick={fetchProjects}
            className="mt-2 underline hover:opacity-75 transition-opacity"
            style={{color: 'var(--error-color)'}}
          >
            Try again
          </button>
        </div>
      )}

      <div className="card-hover rounded-lg shadow-accent" style={{backgroundColor: 'var(--secondary-bg)'}}>
        <div className="p-6 border-b" style={{borderColor: 'var(--border-color)'}}>
          <h2 className="text-xl font-semibold" style={{color: 'var(--text-primary)'}}>Recent Projects</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <p style={{color: 'var(--text-muted)'}}>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12" style={{color: 'var(--text-muted)'}} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="mt-2 text-sm font-medium" style={{color: 'var(--text-primary)'}}>No projects yet</h3>
              <p className="mt-1 text-sm" style={{color: 'var(--text-muted)'}}>Get started by creating a new project and uploading a design.</p>
              <div className="mt-6">
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  Create Project
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project._id} className="border rounded-lg p-4 card-hover" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--secondary-bg)'}}>
                  <h3 className="font-semibold mb-2" style={{color: 'var(--text-primary)'}}>{project.name}</h3>
                  {project.description && (
                    <p className="text-sm mb-3 line-clamp-2" style={{color: 'var(--text-secondary)'}}>{project.description}</p>
                  )}
                  <div className="flex justify-between items-center text-sm" style={{color: 'var(--text-muted)'}}>
                    <span>{project.images?.length || 0} images</span>
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                  <div className="mt-3">
                    <button 
                      onClick={() => navigate(`/projects/${project._id}`)}
                      className="text-sm font-medium hover:opacity-75 transition-opacity text-accent"
                    >
                      View Project →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="rounded-lg max-w-md w-full p-6" style={{backgroundColor: 'var(--secondary-bg)'}}>
            <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Create New Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                  style={{borderColor: 'var(--border-color)', focusRingColor: 'var(--accent-bg)'}}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                  style={{borderColor: 'var(--border-color)', focusRingColor: 'var(--accent-bg)'}}
                  rows="3"
                  placeholder="Enter project description"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProject({ name: '', description: '' });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="btn-primary"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
