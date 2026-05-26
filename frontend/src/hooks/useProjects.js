import { useState, useEffect } from 'react';
import { projectAPI } from '../utils/api';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
      setError('Could not load projects. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    await projectAPI.createProject(data);
    setShowCreate(false);
    fetchProjects();
  };

  const handleDelete = (id, name) => {
    setDeleteTarget({ id, name });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      await projectAPI.deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      setError('Failed to delete project. Please try again.');
    }
  };

  return {
    projects,
    loading,
    error,
    showCreate,
    setShowCreate,
    deleteTarget,
    setDeleteTarget,
    fetchProjects,
    handleCreate,
    handleDelete,
    executeDelete
  };
}
