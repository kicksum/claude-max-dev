const pool = require('../config/database');
const embeddingService = require('./embedding.service');

class RAGService {
  /**
   * Add a document to the RAG system (NO CHUNKING - KISS!)
   */
  async addDocument(title, content, metadata = {}) {
    try {
      console.log(`📚 Adding document: ${title}`);
      
      // NO CHUNKING - just store the whole thing
      // Truncate if too long
      const truncatedContent = content.substring(0, 2000);
      
      // Generate embedding
      console.log('🔄 Generating embedding...');
      const embedding = await embeddingService.generateEmbedding(truncatedContent);
      console.log('✅ Embedding generated');
      
      // Store in database
      const result = await pool.query(
        `INSERT INTO documents (title, content, chunk_index, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [title, truncatedContent, 0, JSON.stringify(embedding), JSON.stringify(metadata)]
      );
      
      console.log(`✅ Document added with ID: ${result.rows[0].id}`);
      
      return {
        success: true,
        document_id: result.rows[0].id
      };
      
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  /**
   * Search for similar documents using vector similarity
   */
  async searchSimilar(query, limit = 5) {
    try {
      console.log(`🔍 Searching for: ${query}`);
      
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      // Search using cosine similarity
      const result = await pool.query(
        `SELECT 
          id,
          title,
          content,
          chunk_index,
          metadata,
          1 - (embedding <=> $1::vector) as similarity
         FROM documents
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        [JSON.stringify(queryEmbedding), limit]
      );
      
      console.log(`🔍 Search results: ${result.rows.length} documents found`);
      
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        chunk_index: row.chunk_index,
        similarity: parseFloat(row.similarity),
        metadata: row.metadata
      }));
      
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  /**
   * Get all documents (for listing)
   */
  async getAllDocuments() {
    try {
      const result = await pool.query(
        `SELECT 
          title,
          COUNT(*) as chunk_count,
          MIN(created_at) as created_at,
          MAX(updated_at) as updated_at,
          (array_agg(id ORDER BY chunk_index))[1] as first_chunk_id
         FROM documents
         GROUP BY title
         ORDER BY created_at DESC`
      );
      
      return result.rows;
      
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  /**
   * Delete a document and all its chunks
   */
  async deleteDocument(title) {
    try {
      const result = await pool.query(
        'DELETE FROM documents WHERE title = $1 RETURNING id',
        [title]
      );
      
      console.log(`🗑️ Deleted document: ${title} (${result.rows.length} chunks)`);
      
      return {
        success: true,
        chunks_deleted: result.rows.length
      };
      
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Build context from search results for RAG
   */
  buildContext(searchResults) {
    if (!searchResults || searchResults.length === 0) {
      return '';
    }
    
    let context = 'Here is relevant information from the knowledge base:\n\n';
    
    searchResults.forEach((result, index) => {
      context += `[Source ${index + 1}: ${result.title}]\n`;
      context += `${result.content}\n\n`;
    });
    
    return context;
  }
}

module.exports = new RAGService();
