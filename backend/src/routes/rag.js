const express = require('express');
const router = express.Router();
const ragService = require('../services/rag.service');
const claudeService = require('../services/claude.service');

// Get all documents in RAG system
router.get('/', async (req, res) => {
  try {
    const documents = await ragService.getAllDocuments();
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a new document to RAG
router.post('/', async (req, res) => {
  try {
    const { title, content, metadata } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const result = await ragService.addDocument(title, content, metadata || {});
    res.json(result);
    
  } catch (error) {
    console.error('Error adding document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search documents by similarity
router.post('/search', async (req, res) => {
  try {
    const { query, limit } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const results = await ragService.searchSimilar(query, limit || 5);
    res.json(results);
    
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a document
router.delete('/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const result = await ragService.deleteDocument(decodeURIComponent(title));
    res.json(result);
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// RAG-enhanced chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, model, conversationHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Search for relevant documents
    const searchResults = await ragService.searchSimilar(message, 3);
    
    // Build context from search results
    const context = ragService.buildContext(searchResults);
    
    // Create enhanced message with context
    let enhancedMessage = message;
    if (context) {
      enhancedMessage = `${context}\n\nUser Question: ${message}\n\nPlease answer the user's question based on the information provided above. If the information isn't sufficient, say so and answer based on your general knowledge.`;
    }
    
    // Build messages array for Claude
    const messages = [];
    
    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }
    
    // Add the enhanced message
    messages.push({
      role: 'user',
      content: enhancedMessage
    });
    
    // Call Claude
    const response = await claudeService.sendMessage(
      messages,
      model || 'claude-sonnet-4-20250514'
    );
    
    res.json({
      message: response.content[0].text,
      usage: response.usage,
      sources: searchResults.map(r => ({
        title: r.title,
        similarity: r.similarity
      }))
    });
    
  } catch (error) {
    console.error('Error in RAG chat:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
