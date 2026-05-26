const Project = require('../models/Project');

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: 'active' })
      .sort({ updatedAt: -1 })
      .populate('images');
    
    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }
    
    const project = new Project({
      name,
      description
    });
    
    await project.save();
    
    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('images');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
};

exports.archiveProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status: 'archived', updatedAt: Date.now() },
      { new: true }
    );
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Project archived successfully'
    });
  } catch (error) {
    console.error('Error archiving project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive project'
    });
  }
};
