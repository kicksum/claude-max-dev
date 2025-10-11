const express = require('express');
const router = express.Router();
const projectService = require('../services/project.service');

// Get all projects
router.get('/', async (req, res, next) => {
  try {
    const projects = await projectService.getAllProjects();
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// Create new project
router.post('/', async (req, res, next) => {
  try {
    const { name, description, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    const project = await projectService.createProject(name, description, color, icon);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// Get specific project
router.get('/:id', async (req, res, next) => {
  try {
    const project = await projectService.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Get project with its conversations
router.get('/:id/conversations', async (req, res, next) => {
  try {
    const projectData = await projectService.getProjectWithConversations(req.params.id);
    if (!projectData) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(projectData);
  } catch (error) {
    next(error);
  }
});

// Update project
router.patch('/:id', async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
