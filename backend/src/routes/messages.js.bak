const express = require('express');
const router = express.Router();
const conversationService = require('../services/conversation.service');
const claudeService = require('../services/claude.service');

// Get messages for a conversation
router.get('/:conversationId', async (req, res, next) => {
  try {
    const messages = await conversationService.getMessages(req.params.conversationId);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// Send a message (and get Claude's response)
router.post('/', async (req, res, next) => {
  try {
    const { conversationId, content, model } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ error: 'conversationId and content are required' });
    }

    // Get conversation to check model
    const conversation = await conversationService.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const useModel = model || conversation.model;

    // Save user message
    await conversationService.saveMessage(
      conversationId,
      'user',
      content,
      0,
      0,
      0
    );

    // Get conversation history for context
    const history = await conversationService.getMessages(conversationId);
    
    // Format messages for Claude API (exclude the message we just saved from history count)
    const claudeMessages = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Send to Claude
    const response = await claudeService.sendMessage(claudeMessages, useModel);

    // Save Claude's response
    const savedMessage = await conversationService.saveMessage(
      conversationId,
      'assistant',
      response.content,
      response.cost,
      response.inputTokens,
      response.outputTokens
    );

    // Get updated conversation stats
    const updatedConversation = await conversationService.getConversation(conversationId);

    res.json({
      message: savedMessage,
      conversation: updatedConversation,
      usage: {
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        cost: response.cost
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
