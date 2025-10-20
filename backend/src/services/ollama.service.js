const axios = require('axios');

// Local infrastructure endpoints
const OLLAMA_HOST = 'http://192.168.1.7:11434';  // Clyde - Direct Ollama
const RAG_HOST = 'http://192.168.1.16:8000';     // RAG1 - RAG-enhanced FastAPI

// Local models configuration
const LOCAL_MODELS = {
  'local-deepseek-r1-8b': {
    ollamaModel: 'deepseek-r1:8b',
    useRag: false,
    displayName: 'DeepSeek R1 8B (Local)'
  },
  'local-deepseek-r1-8b-rag': {
    ollamaModel: 'deepseek-r1:8b',
    useRag: true,
    displayName: 'DeepSeek R1 8B + RAG (Local)'
  }
};

/**
 * Check if a model ID is a local model
 */
function isLocalModel(modelId) {
  return modelId && modelId.startsWith('local-');
}

/**
 * Estimate token count (rough approximation)
 * Real Ollama doesn't provide exact token counts, so we estimate
 */
function estimateTokens(text) {
  if (!text) return 0;
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost for local models (always $0, but we track tokens for stats)
 */
function calculateLocalCost(inputTokens, outputTokens) {
  return 0; // Free! 🎉
}

/**
 * Send message directly to Ollama
 */
async function sendToOllama(messages, ollamaModel) {
  try {
    // Convert conversation history to Ollama format
    // Ollama expects a simple prompt, so we'll concatenate the conversation
    let prompt = '';
    for (const msg of messages) {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n\n`;
      }
    }
    
    console.log(`🤖 Sending to Ollama (${ollamaModel}) at ${OLLAMA_HOST}...`);
    
    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: ollamaModel,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
      }
    }, {
      timeout: 120000, // 2 minute timeout for slower CPU inference
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.response;
    const inputTokens = estimateTokens(prompt);
    const outputTokens = estimateTokens(content);

    console.log(`✅ Ollama response received (${outputTokens} tokens)`);

    return {
      content: content,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      cost: 0,
      model: ollamaModel,
      source: 'ollama-direct'
    };

  } catch (error) {
    console.error('❌ Ollama API error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to Ollama at ${OLLAMA_HOST}. Is Ollama running on Clyde?`);
    }
    throw new Error(`Ollama API error: ${error.message}`);
  }
}

/**
 * Send message to RAG-enhanced endpoint
 */
async function sendToRAG(messages, ollamaModel) {
  try {
    // Get the last user message as the query
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const query = lastUserMessage ? lastUserMessage.content : '';

    console.log(`🧠 Sending to RAG service at ${RAG_HOST}...`);

    const response = await axios.post(`${RAG_HOST}/query`, {
      query: query,
      model: ollamaModel
    }, {
      timeout: 120000, // 2 minute timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.answer || response.data.response;
    const retrievedContext = response.data.context || [];
    
    // Estimate tokens
    const inputTokens = estimateTokens(query) + estimateTokens(JSON.stringify(retrievedContext));
    const outputTokens = estimateTokens(content);

    console.log(`✅ RAG response received with ${retrievedContext.length} context chunks`);

    return {
      content: content,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      cost: 0,
      model: ollamaModel,
      source: 'rag-enhanced',
      contextChunks: retrievedContext.length
    };

  } catch (error) {
    console.error('❌ RAG API error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to RAG service at ${RAG_HOST}. Is RAG1 FastAPI running?`);
    }
    throw new Error(`RAG API error: ${error.message}`);
  }
}

/**
 * Main entry point - route to appropriate local service
 */
async function sendMessage(messages, model = 'local-deepseek-r1-8b', maxTokens = 4096) {
  if (!isLocalModel(model)) {
    throw new Error(`Not a local model: ${model}`);
  }

  const modelConfig = LOCAL_MODELS[model];
  if (!modelConfig) {
    throw new Error(`Unknown local model: ${model}`);
  }

  console.log(`\n🏠 Local Model Request: ${modelConfig.displayName}`);
  console.log(`   Model: ${modelConfig.ollamaModel}`);
  console.log(`   RAG: ${modelConfig.useRag ? 'Enabled 🧠' : 'Disabled'}`);
  console.log(`   Messages: ${messages.length}`);

  // Route to appropriate service
  if (modelConfig.useRag) {
    return await sendToRAG(messages, modelConfig.ollamaModel);
  } else {
    return await sendToOllama(messages, modelConfig.ollamaModel);
  }
}

/**
 * Health check for local services
 */
async function healthCheck() {
  const results = {
    ollama: false,
    rag: false,
    timestamp: new Date().toISOString()
  };

  // Check Ollama
  try {
    await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 5000 });
    results.ollama = true;
  } catch (error) {
    console.warn('⚠️  Ollama health check failed:', error.message);
  }

  // Check RAG service
  try {
    await axios.get(`${RAG_HOST}/health`, { timeout: 5000 });
    results.rag = true;
  } catch (error) {
    console.warn('⚠️  RAG health check failed:', error.message);
  }

  return results;
}

module.exports = {
  sendMessage,
  isLocalModel,
  calculateLocalCost,
  LOCAL_MODELS,
  healthCheck
};
