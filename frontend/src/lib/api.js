const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.8:8000';

export async function fetchConversations() {
  const res = await fetch(`${API_URL}/api/conversations`);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function createConversation(title, model = 'claude-sonnet-4-20250514') {
  const res = await fetch(`${API_URL}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, model }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function getConversation(id) {
  const res = await fetch(`${API_URL}/api/conversations/${id}`);
  if (!res.ok) throw new Error('Failed to fetch conversation');
  return res.json();
}

export async function deleteConversation(id) {
  const res = await fetch(`${API_URL}/api/conversations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
  return res.json();
}

export async function getMessages(conversationId) {
  const res = await fetch(`${API_URL}/api/messages/${conversationId}`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function sendMessage(conversationId, content, model, fileIds = []) {
  const res = await fetch(`${API_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, content, model, fileIds }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function searchConversations(query) {
  const res = await fetch(`${API_URL}/api/conversations/search/${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search');
  return res.json();
}
// ==================== PROJECTS ====================

export async function fetchProjects() {
  const res = await fetch(`${API_URL}/api/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(name, description, color = '#3B82F6', icon = '📁') {
  const res = await fetch(`${API_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, color, icon }),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function updateProject(id, updates) {
  const res = await fetch(`${API_URL}/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json();
}

export async function deleteProject(id) {
  const res = await fetch(`${API_URL}/api/projects/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete project');
  return res.json();
}

export async function assignConversationToProject(conversationId, projectId) {
  const res = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId }),
  });
  if (!res.ok) throw new Error('Failed to assign conversation to project');
  return res.json();
}
// Update conversation title
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

// Generate conversation title from first message
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

// ==================== FILE UPLOAD ====================

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

// ==================== EXPORT & REPORTS ====================

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
