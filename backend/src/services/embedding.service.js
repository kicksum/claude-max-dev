const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class EmbeddingService {
  /**
   * SUPER SIMPLE embedding generation - just create a basic hash
   * This is KISS to the extreme - good enough for basic similarity
   */
  async generateEmbedding(text) {
    // Create a 1024-dimension vector filled with zeros
    const embedding = new Float32Array(1024);
    
    // Use a simple character-based hash to populate the vector
    // This is deterministic - same text = same embedding
    for (let i = 0; i < Math.min(text.length, 1024); i++) {
      const charCode = text.charCodeAt(i);
      embedding[i] = (charCode % 256) / 255.0; // Normalize to 0-1
    }
    
    // Convert to regular array for JSON
    return Array.from(embedding);
  }

  /**
   * Generate embeddings for multiple texts
   */
  async generateEmbeddings(texts) {
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }

  /**
   * Chunk text into smaller pieces for embedding
   * Each chunk should be ~500-1000 characters
   */
  chunkText(text, chunkSize = 500, overlap = 50) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      chunks.push(chunk);
      start = end - overlap;
      if (start >= text.length) break;
    }

    return chunks;
  }
}

module.exports = new EmbeddingService();
