const API_URL = 'http://192.168.1.8:8000';

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

export async function sendMessage(conversationId, content, model) {
  const res = await fetch(`${API_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, content, model }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function searchConversations(query) {
  const res = await fetch(`${API_URL}/api/conversations/search/${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search');
  return res.json();
}
