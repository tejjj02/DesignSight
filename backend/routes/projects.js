const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projectsController');

// GET /api/projects - Get all projects
router.get('/', projectsController.getAllProjects);

// POST /api/projects - Create new project
router.post('/', projectsController.createProject);

// GET /api/projects/:id - Get specific project
router.get('/:id', projectsController.getProject);

// PUT /api/projects/:id - Update project
router.put('/:id', projectsController.updateProject);

// DELETE /api/projects/:id - Archive project (soft delete)
router.delete('/:id', projectsController.archiveProject);

module.exports = router;
