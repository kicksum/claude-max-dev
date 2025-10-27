/**
 * Add this to your backend: ~/claude-max-dev/backend/src/routes/models.js
 * This fetches available models from Ollama via RAG1
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

const RAG_URL = process.env.RAG_URL || 'http://192.168.1.16:8000';

/**
 * Get all available models (cloud + local)
 */
router.get('/', async (req, res) => {
  try {
    // Cloud models (hardcoded, from Anthropic)
    const cloudModels = [
      { 
        id: 'claude-3-5-haiku-20241022', 
        name: 'Haiku 3.5', 
        cost: '$1/$5',
        type: 'cloud',
        provider: 'anthropic'
      },
      { 
        id: 'claude-sonnet-4-20250514', 
        name: 'Sonnet 4', 
        cost: '$3/$15',
        type: 'cloud',
        provider: 'anthropic'
      },
      { 
        id: 'claude-opus-4-20250514', 
        name: 'Opus 4', 
        cost: '$15/$75',
        type: 'cloud',
        provider: 'anthropic'
      }
    ];

    // Fetch local models from RAG1/Ollama
    let localModels = [];
    
    try {
      const response = await axios.get(`${RAG_URL}/api/models`, { timeout: 5000 });
      
      if (response.data && response.data.models) {
        localModels = response.data.models.map(model => {
          const modelName = model.name;
          const baseModelId = modelName.replace(':', '-'); // deepseek-r1:8b → deepseek-r1-8b
          
          // Format name nicely
          let displayName = modelName;
          if (modelName.includes('deepseek-r1')) {
            displayName = 'DeepSeek R1 ' + modelName.split(':')[1].toUpperCase();
          } else if (modelName.includes('mistral')) {
            displayName = 'Mistral ' + (modelName.split(':')[1] || 'Latest');
          }
          
          return [
            {
              id: `local-${baseModelId}`,
              name: `${displayName} (Local)`,
              cost: 'FREE 🏠',
              type: 'local',
              provider: 'ollama',
              ollamaModel: modelName
            },
            {
              id: `local-${baseModelId}-rag`,
              name: `${displayName} + RAG`,
              cost: 'FREE 🧠',
              type: 'local',
              provider: 'ollama',
              ollamaModel: modelName
            }
          ];
        }).flat();
      }
    } catch (error) {
      console.error('[Models] Failed to fetch local models from RAG1:', error.message);
      // Continue without local models if RAG1 is down
    }

    // Combine all models
    const allModels = [...cloudModels, ...localModels];

    res.json({
      models: allModels,
      localModelsAvailable: localModels.length > 0,
      ragUrl: RAG_URL
    });

  } catch (error) {
    console.error('[Models] Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

/**
 * Get details about a specific model
 */
router.get('/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    
    // Check if it's a local model
    if (modelId.startsWith('local-')) {
      const ollamaModelName = modelId
        .replace('local-', '')
        .replace('-rag', '')
        .replace(/-(\d+[a-z]*)$/, ':$1'); // Convert back to ollama format
      
      res.json({
        id: modelId,
        type: 'local',
        ollamaModel: ollamaModelName,
        hasRAG: modelId.includes('-rag'),
        ragUrl: RAG_URL
      });
    } else {
      // Cloud model
      res.json({
        id: modelId,
        type: 'cloud',
        provider: 'anthropic'
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get model details' });
  }
});

module.exports = router;
