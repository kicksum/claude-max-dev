const express = require('express');
const router = express.Router();
const conversationService = require('../services/conversation.service');
const claudeService = require('../services/claude.service');

// Get all conversations
router.get('/', async (req, res) => {
  try {
    const conversations = await conversationService.getAllConversations();
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new conversation
router.post('/', async (req, res) => {
  try {
    const { title, model } = req.body;
    const conversation = await conversationService.createConversation(title || 'New Chat', model);
    res.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update conversation title
router.put('/:id/title', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const conversation = await conversationService.updateConversation(id, { title: title.trim() });
    res.json(conversation);
  } catch (error) {
    console.error('Error updating conversation title:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update conversation (including project assignment)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const conversation = await conversationService.updateConversation(id, updates);
    res.json(conversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete conversation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await conversationService.deleteConversation(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate title from message content
router.post('/:id/generate-title', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Use Claude to generate a short, descriptive title
    const titlePrompt = `Generate a very short, concise title (3-6 words max) for a conversation that starts with: "${content.substring(0, 200)}..."

Reply with ONLY the title, no quotes, no explanation.`;
    
    const title = await claudeService.generateTitle(titlePrompt);
    
    // Update the conversation with the new title
    const conversation = await conversationService.updateConversation(id, { title });
    
    res.json(conversation);
  } catch (error) {
    console.error('Error generating title:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
