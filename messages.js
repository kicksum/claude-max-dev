const express = require('express');
const router = express.Router();
const conversationService = require('../services/conversation.service');
const claudeService = require('../services/claude.service');
const pool = require('../config/database');
const fs = require('fs').promises;
const axios = require('axios');

// RAG Service Configuration
const RAG_URL = process.env.RAG_URL || 'http://192.168.1.16:8000';

/**
 * Determine if a model is local or cloud
 */
function isLocalModel(model) {
  return model && model.startsWith('local-');
}

/**
 * Extract the actual model name for RAG1
 */
function getRAGModelName(model) {
  // Remove 'local-' prefix
  let modelName = model.replace('local-', '');
  
  // Remove '-rag' suffix if present
  modelName = modelName.replace(/-rag$/, '');
  
  // Convert last dash to colon for version/tag
  const match = modelName.match(/^(.+)-([0-9]+[a-z]*|latest|instruct|chat|code)$/);
  
  if (match) {
    const baseName = match[1];
    const version = match[2];
    return `${baseName}:${version}`;
  }
  
  console.warn(`[RAG] Model name pattern not matched: ${modelName}, using as-is`);
  return modelName;
}

/**
 * Check if RAG context should be included
 */
function shouldIncludeRAGContext(model) {
  return model && model.includes('-rag');
}

/**
 * Query RAG1 service
 */
async function queryRAG(message, model, includeContext = false) {
  try {
    console.log(`[RAG] Querying RAG1: ${RAG_URL}`);
    console.log(`[RAG] Model: ${model}, Context: ${includeContext}`);

    const response = await axios.post(
      `${RAG_URL}/api/rag`,
      {
        query: message,
        model: model,
        include_context: includeContext,
        top_k: 5,
        temperature: 0.7
      },
      { timeout: 60000 }
    );

    console.log(`[RAG] Success! Tokens/sec: ${response.data.tokens_per_second}`);

    return {
      success: true,
      content: response.data.response,
      context: response.data.context || [],
      tokensPerSecond: response.data.tokens_per_second
    };
  } catch (error) {
    console.error('[RAG] Query failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to RAG service. Is it running on 192.168.1.16:8000?');
    }
    
    if (error.response) {
      throw new Error(`RAG service error: ${error.response.data?.detail || error.response.statusText}`);
    }
    
    throw new Error(`RAG service error: ${error.message}`);
  }
}

// Get messages for a conversation
router.get('/:conversationId', async (req, res, next) => {
  try {
    const messages = await conversationService.getMessages(req.params.conversationId);

    // For each message, fetch attached files
    for (let message of messages) {
      const filesResult = await pool.query(
        'SELECT * FROM message_files WHERE message_id = $1 ORDER BY created_at ASC',
        [message.id]
      );
      message.files = filesResult.rows;
    }

    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// Send a message (and get Claude's or local RAG response)
router.post('/', async (req, res, next) => {
  try {
    const { conversationId, content, model, fileIds } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ error: 'conversationId and content are required' });
    }

    // Get conversation to check model
    const conversation = await conversationService.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Use provided model, fallback to conversation model, then default
    const useModel = model || conversation.model || 'claude-sonnet-4-20250514';
    console.log(`[API] Processing message with model: ${useModel}`);

    // 🆕 UPDATE CONVERSATION MODEL - Persist the selected model
    if (model && model !== conversation.model) {
      await conversationService.updateConversation(conversationId, { model });
      console.log(`[API] Updated conversation model to: ${model}`);
    }

    // Save user message (no model_used for user messages)
    const userMessage = await conversationService.saveMessage(
      conversationId,
      'user',
      content,
      0,
      0,
      0,
      null // user messages don't have model_used
    );

    // Link files to message if any
    if (fileIds && fileIds.length > 0) {
      for (const fileId of fileIds) {
        await pool.query(
          'UPDATE message_files SET message_id = $1 WHERE id = $2',
          [userMessage.id, fileId]
        );
      }
    }

    let assistantContent;
    let usage = { inputTokens: 0, outputTokens: 0, cost: 0 };

    // 🆕 GET FULL CONVERSATION HISTORY (excluding the message we just saved)
    const history = await conversationService.getMessages(conversationId);
    const historyWithoutCurrent = history.filter(msg => msg.id !== userMessage.id);

    // Route to appropriate service based on model type
    if (isLocalModel(useModel)) {
      // LOCAL RAG MODEL
      console.log('[API] Routing to RAG1 (local LLM)');
      
      const ragModelName = getRAGModelName(useModel);
      const includeContext = shouldIncludeRAGContext(useModel);
      
      try {
        // 🆕 BUILD CONVERSATION HISTORY FOR LOCAL MODELS
        // Note: Most local models through Ollama don't support full conversation history
        // but we'll include the last few exchanges for context
        let contextualPrompt = content;
        
        if (historyWithoutCurrent.length > 0) {
          // Get last 3 exchanges (6 messages max) for context
          const recentHistory = historyWithoutCurrent.slice(-6);
          const contextMessages = recentHistory
            .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
            .join('\n\n');
          
          contextualPrompt = `Previous conversation:\n${contextMessages}\n\nHuman: ${content}`;
          console.log(`[API] Including ${recentHistory.length} previous messages in context`);
        }

        const ragResult = await queryRAG(contextualPrompt, ragModelName, includeContext);

        if (!ragResult.success) {
          throw new Error('RAG query failed');
        }

        assistantContent = ragResult.content;
        usage = { inputTokens: 0, outputTokens: 0, cost: 0 };

        console.log(`[API] RAG response received (${ragResult.tokensPerSecond.toFixed(2)} tokens/sec)`);

      } catch (error) {
        console.error('[API] RAG error:', error);
        throw new Error(`Failed to get response from local model: ${error.message}`);
      }

    } else {
      // CLOUD CLAUDE MODEL
      console.log('[API] Routing to Claude API');

      // 🆕 BUILD FULL CLAUDE MESSAGE HISTORY WITH FILES
      const claudeMessages = [];

      for (const msg of historyWithoutCurrent) {
        // Get files for this message
        const filesResult = await pool.query(
          'SELECT * FROM message_files WHERE message_id = $1',
          [msg.id]
        );
        const messageFiles = filesResult.rows;
        
        console.log(`📎 Message ${msg.id} (${msg.role}) has ${messageFiles.length} files`);

        if (messageFiles.length > 0) {
          // Message has attachments - format as multi-part content
          const contentArray = [];

          // Add files first
          for (const file of messageFiles) {
            if (file.mime_type.startsWith('image/')) {
              const fileData = await fs.readFile(file.file_path);
              const base64Data = fileData.toString('base64');
              contentArray.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: file.mime_type,
                  data: base64Data
                }
              });
            } else if (file.mime_type === 'application/pdf') {
              const fileData = await fs.readFile(file.file_path);
              const base64Data = fileData.toString('base64');
              contentArray.push({
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Data
                }
              });
            } else if (file.mime_type.startsWith('text/') || file.mime_type === 'application/json') {
              const fileContent = await fs.readFile(file.file_path, 'utf-8');
              contentArray.push({
                type: 'text',
                text: `File: ${file.original_filename}\n\n${fileContent}`
              });
            }
          }

          // Add text content last
          contentArray.push({
            type: 'text',
            text: msg.content
          });

          claudeMessages.push({
            role: msg.role,
            content: contentArray
          });
        } else {
          // No attachments - simple text message
          claudeMessages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }

      console.log(`[API] Sending ${claudeMessages.length} messages to Claude (full history)`);

      // Send to Claude with FULL conversation history
      const response = await claudeService.sendMessage(claudeMessages, useModel);

      assistantContent = response.content;
      usage = {
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        cost: response.cost
      };

      console.log(`[API] Claude response received (${usage.inputTokens + usage.outputTokens} tokens)`);
    }

    // 🆕 SAVE ASSISTANT'S RESPONSE WITH MODEL TRACKING
    const savedMessage = await conversationService.saveMessage(
      conversationId,
      'assistant',
      assistantContent,
      usage.cost,
      usage.inputTokens,
      usage.outputTokens,
      useModel // 🆕 Track which model generated this response
    );

    // Get updated conversation stats
    const updatedConversation = await conversationService.getConversation(conversationId);

    res.json({
      message: savedMessage,
      conversation: updatedConversation,
      usage: usage
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
