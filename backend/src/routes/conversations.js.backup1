const express = require('express');
const router = express.Router();
const conversationService = require('../services/conversation.service');

// Get all conversations
router.get('/', async (req, res, next) => {
  try {
    const conversations = await conversationService.getAllConversations();
    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// Create new conversation
router.post('/', async (req, res, next) => {
  try {
    const { title, model } = req.body;
    const conversation = await conversationService.createConversation(title, model);
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
});

// Get specific conversation
router.get('/:id', async (req, res, next) => {
  try {
    const conversation = await conversationService.getConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

// Update conversation
router.patch('/:id', async (req, res, next) => {
  try {
    const conversation = await conversationService.updateConversation(req.params.id, req.body);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

// Delete conversation
router.delete('/:id', async (req, res, next) => {
  try {
    await conversationService.deleteConversation(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Search conversations
router.get('/search/:query', async (req, res, next) => {
  try {
    const results = await conversationService.searchConversations(req.params.query);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
