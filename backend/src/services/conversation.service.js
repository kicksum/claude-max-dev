const db = require('../config/database');

async function createConversation(title, model) {
  const result = await db.query(
    `INSERT INTO conversations (title, model)
     VALUES ($1, $2)
     RETURNING *`,
    [title, model]
  );
  return result.rows[0];
}

async function getAllConversations() {
  const result = await db.query(
    `SELECT * FROM conversations
     ORDER BY updated_at DESC`
  );
  return result.rows;
}

async function getConversation(id) {
  const result = await db.query(
    `SELECT * FROM conversations
     WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

async function updateConversation(id, updates) {
  const { title, total_input_tokens, total_output_tokens, total_cost, project_id } = updates;

  const result = await db.query(
    `UPDATE conversations
     SET title = COALESCE($1, title),
         total_input_tokens = COALESCE($2, total_input_tokens),
         total_output_tokens = COALESCE($3, total_output_tokens),
         total_cost = COALESCE($4, total_cost),
         project_id = COALESCE($5, project_id),
         updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [title, total_input_tokens, total_output_tokens, total_cost, project_id, id]
  );
  return result.rows[0];
}

async function deleteConversation(id) {
  await db.query('DELETE FROM conversations WHERE id = $1', [id]);
}

async function saveMessage(conversationId, role, content, model, cost, inputTokens, outputTokens) {
  const result = await db.query(
    `INSERT INTO messages (conversation_id, role, content, model, cost, input_tokens, output_tokens)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [conversationId, role, content, model, cost, inputTokens, outputTokens]
  );
  
  // Update conversation totals
  await db.query(
    `UPDATE conversations
     SET total_input_tokens = total_input_tokens + $1,
         total_output_tokens = total_output_tokens + $2,
         total_cost = total_cost + $3,
         updated_at = NOW()
     WHERE id = $4`,
    [inputTokens, outputTokens, cost, conversationId]
  );
  
  return result.rows[0];
}

async function getMessages(conversationId) {
  const result = await db.query(
    `SELECT * FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );
  return result.rows;
}

async function searchConversations(query) {
  const result = await db.query(
    `SELECT DISTINCT c.*
     FROM conversations c
     LEFT JOIN messages m ON c.id = m.conversation_id
     WHERE c.title ILIKE $1
        OR m.content ILIKE $1
     ORDER BY c.updated_at DESC`,
    [`%${query}%`]
  );
  return result.rows;
}

module.exports = {
  createConversation,
  getAllConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  saveMessage,
  getMessages,
  searchConversations
};
