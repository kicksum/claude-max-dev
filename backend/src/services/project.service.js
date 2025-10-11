const db = require('../config/database');

async function createProject(name, description, color = '#3B82F6', icon = '📁') {
  const result = await db.query(
    'INSERT INTO projects (name, description, color, icon) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, description, color, icon]
  );
  return result.rows[0];
}

async function getProject(id) {
  const result = await db.query(
    'SELECT * FROM projects WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

async function getAllProjects() {
  const result = await db.query(
    'SELECT * FROM projects ORDER BY name ASC'
  );
  return result.rows;
}

async function updateProject(id, updates) {
  const { name, description, color, icon } = updates;
  
  const result = await db.query(
    `UPDATE projects 
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         color = COALESCE($3, color),
         icon = COALESCE($4, icon)
     WHERE id = $5
     RETURNING *`,
    [name, description, color, icon, id]
  );
  return result.rows[0];
}

async function deleteProject(id) {
  // This will set project_id to NULL for all conversations in this project
  await db.query('DELETE FROM projects WHERE id = $1', [id]);
  return { success: true };
}

async function getProjectWithConversations(id) {
  const project = await getProject(id);
  if (!project) return null;
  
  const conversations = await db.query(
    'SELECT * FROM conversations WHERE project_id = $1 ORDER BY updated_at DESC',
    [id]
  );
  
  return {
    ...project,
    conversations: conversations.rows
  };
}

module.exports = {
  createProject,
  getProject,
  getAllProjects,
  updateProject,
  deleteProject,
  getProjectWithConversations
};
