const db = require('../config/database');

async function createConversation(title, model = 'claude-sonnet-4-20250514') {
  const result = await db.query(
    'INSERT INTO conversations (title, model) VALUES ($1, $2) RETURNING *',
    [title || 'New Conversation', model]
  );
  return result.rows[0];
}

async function getConversation(id) {
  const result = await db.query(
    'SELECT * FROM conversations WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

async function getAllConversations(limit = 50) {
  const result = await db.query(
    'SELECT * FROM conversations ORDER BY updated_at DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

async function updateConversation(id, updates) {
  const { title, total_input_tokens, total_output_tokens, total_cost } = updates;
  
  const result = await db.query(
    `UPDATE conversations 
     SET title = COALESCE($1, title),
         total_input_tokens = COALESCE($2, total_input_tokens),
         total_output_tokens = COALESCE($3, total_output_tokens),
         total_cost = COALESCE($4, total_cost)
     WHERE id = $5
     RETURNING *`,
    [title, total_input_tokens, total_output_tokens, total_cost, id]
  );
  return result.rows[0];
}

async function deleteConversation(id) {
  await db.query('DELETE FROM conversations WHERE id = $1', [id]);
  return { success: true };
}

async function saveMessage(conversationId, role, content, inputTokens = 0, outputTokens = 0, cost = 0) {
  const result = await db.query(
    `INSERT INTO messages (conversation_id, role, content, input_tokens, output_tokens, cost)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [conversationId, role, content, inputTokens, outputTokens, cost]
  );
  
  // Update conversation totals
  await db.query(
    `UPDATE conversations 
     SET total_input_tokens = total_input_tokens + $1,
         total_output_tokens = total_output_tokens + $2,
         total_cost = total_cost + $3,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4`,
    [inputTokens, outputTokens, cost, conversationId]
  );
  
  return result.rows[0];
}

async function getMessages(conversationId) {
  const result = await db.query(
    'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
    [conversationId]
  );
  return result.rows;
}

async function searchConversations(query) {
  const result = await db.query(
    `SELECT DISTINCT c.* 
     FROM conversations c
     LEFT JOIN messages m ON c.id = m.conversation_id
     WHERE c.title ILIKE $1 OR m.content ILIKE $1
     ORDER BY c.updated_at DESC
     LIMIT 20`,
    [`%${query}%`]
  );
  return result.rows;
}

module.exports = {
  createConversation,
  getConversation,
  getAllConversations,
  updateConversation,
  deleteConversation,
  saveMessage,
  getMessages,
  searchConversations
};
