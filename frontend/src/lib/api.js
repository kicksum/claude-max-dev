// ==================== API CONFIGURATION ====================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.8:8000';

// ==================== CONVERSATIONS ====================

/**
 * Fetch all conversations for the user
 * @returns {Promise<Array>} Array of conversation objects
 */
export async function fetchConversations() {
  const res = await fetch(`${API_URL}/api/conversations`);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

/**
 * Create a new conversation
 * @param {string} title - Title of the conversation
 * @param {string} model - AI model to use (default: claude-sonnet-4-20250514)
 * @returns {Promise<Object>} The created conversation object
 */
export async function createConversation(title, model = 'claude-sonnet-4-20250514') {
  const res = await fetch(`${API_URL}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, model }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

/**
 * Get a specific conversation by ID
 * @param {string} id - Conversation ID
 * @returns {Promise<Object>} The conversation object
 */
export async function getConversation(id) {
  const res = await fetch(`${API_URL}/api/conversations/${id}`);
  if (!res.ok) throw new Error('Failed to fetch conversation');
  return res.json();
}

/**
 * Delete a conversation by ID
 * @param {string} id - Conversation ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteConversation(id) {
  const res = await fetch(`${API_URL}/api/conversations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
  return res.json();
}

/**
 * Update conversation title
 * @param {string} conversationId - Conversation ID
 * @param {string} title - New title for the conversation
 * @returns {Promise<Object>} Updated conversation object
 */
export async function updateConversationTitle(conversationId, title) {
  const response = await fetch(`${API_URL}/api/conversations/${conversationId}/title`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error('Failed to update conversation title');
  }

  return response.json();
}

/**
 * Generate conversation title from first message using AI
 * @param {string} conversationId - Conversation ID
 * @param {string} content - Message content to generate title from
 * @returns {Promise<Object>} Object with generated title
 */
export async function generateConversationTitle(conversationId, content) {
  const response = await fetch(`${API_URL}/api/conversations/${conversationId}/generate-title`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate conversation title');
  }

  return response.json();
}

/**
 * Search conversations by query
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching conversations
 */
export async function searchConversations(query) {
  const res = await fetch(`${API_URL}/api/conversations/search/${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search');
  return res.json();
}

/**
 * Export a conversation to markdown or JSON format
 * Automatically triggers browser download of the exported file
 * @param {string} conversationId - Conversation ID
 * @param {string} format - Export format ('markdown' or 'json')
 */
export async function exportConversation(conversationId, format = 'markdown') {
  const res = await fetch(`${API_URL}/api/conversations/${conversationId}/export?format=${format}`);

  if (!res.ok) throw new Error('Failed to export conversation');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation-${conversationId}.${format === 'json' ? 'json' : 'md'}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Generate global usage report (CSV)
 * Automatically triggers browser download of the CSV file
 */
export async function generateGlobalReport() {
  const res = await fetch(`${API_URL}/api/conversations/report/usage`);

  if (!res.ok) throw new Error('Failed to generate report');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `usage-report-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// ==================== MESSAGES ====================

/**
 * Get all messages for a specific conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Array>} Array of message objects
 */
export async function getMessages(conversationId) {
  const res = await fetch(`${API_URL}/api/messages/${conversationId}`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

/**
 * Send a message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} content - Message content
 * @param {string} model - AI model to use
 * @param {Array<string>} fileIds - Array of uploaded file IDs to attach (optional)
 * @returns {Promise<Object>} The created message object
 */
export async function sendMessage(conversationId, content, model, fileIds = []) {
  const res = await fetch(`${API_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, content, model, fileIds }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

// ==================== PROJECTS ====================

/**
 * Fetch all projects
 * @returns {Promise<Array>} Array of project objects
 */
export async function fetchProjects() {
  const res = await fetch(`${API_URL}/api/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

/**
 * Create a new project
 * @param {string} name - Project name
 * @param {string} description - Project description
 * @param {string} color - Project color hex code (default: '#3B82F6')
 * @param {string} icon - Project icon emoji (default: '📁')
 * @returns {Promise<Object>} The created project object
 */
export async function createProject(name, description, color = '#3B82F6', icon = '📁') {
  const res = await fetch(`${API_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, color, icon }),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

/**
 * Update an existing project
 * @param {string} id - Project ID
 * @param {Object} updates - Object containing fields to update (name, description, color, icon)
 * @returns {Promise<Object>} Updated project object
 */
export async function updateProject(id, updates) {
  const res = await fetch(`${API_URL}/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json();
}

/**
 * Delete a project by ID
 * @param {string} id - Project ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteProject(id) {
  const res = await fetch(`${API_URL}/api/projects/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete project');
  return res.json();
}

/**
 * Assign a conversation to a project
 * @param {string} conversationId - Conversation ID
 * @param {string|null} projectId - Project ID (null to unassign from project)
 * @returns {Promise<Object>} Updated conversation object
 */
export async function assignConversationToProject(conversationId, projectId) {
  const res = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId }),
  });
  if (!res.ok) throw new Error('Failed to assign conversation to project');
  return res.json();
}

// ==================== FILE UPLOAD ====================

/**
 * Upload a file (image, PDF, text, code)
 * @param {File} file - File object to upload
 * @returns {Promise<Object>} Object containing file id and metadata
 */
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Failed to upload file');
  return res.json();
}
