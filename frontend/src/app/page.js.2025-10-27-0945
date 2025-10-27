'use client';

import { useState, useEffect, useRef } from 'react';
import * as api from '../lib/api';
import { marked } from 'marked';
import FileUpload from '../components/FileUpload';

export default function Home() {
  const [conversations, setConversations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedFileIds, setUploadedFileIds] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // Title editing state
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editingSidebarId, setEditingSidebarId] = useState(null);
  const [editedSidebarTitle, setEditedSidebarTitle] = useState('');

  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const titleInputRef = useRef(null);
  const sidebarInputRef = useRef(null);

  // 🆕 UPDATED: Added local models to the dropdown
  const models = [
    { id: 'claude-3-5-haiku-20241022', name: 'Haiku 3.5', cost: '$1/$5', type: 'cloud' },
    { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4', cost: '$3/$15', type: 'cloud' },
    { id: 'claude-opus-4-20250514', name: 'Opus 4', cost: '$15/$75', type: 'cloud' },
    { id: 'local-deepseek-r1-8b', name: 'DeepSeek R1 8B (Local)', cost: 'FREE 🏠', type: 'local' },
    { id: 'local-deepseek-r1-8b-rag', name: 'DeepSeek R1 8B + RAG', cost: 'FREE 🧠', type: 'local' },
  ];

  useEffect(() => {
    loadConversations();
    loadProjects();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      setSearchQuery('');
      setSearchActive(false);
      setCurrentMatchIndex(0);
      setTotalMatches(0);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (searchQuery.trim() && searchActive) {
      highlightMatches();
    } else {
      clearHighlights();
    }
  }, [searchQuery, searchActive, messages, currentMatchIndex]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (editingSidebarId && sidebarInputRef.current) {
      sidebarInputRef.current.focus();
      sidebarInputRef.current.select();
    }
  }, [editingSidebarId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProjects = async () => {
    try {
      const data = await api.fetchProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await api.fetchConversations();
      setConversations(data);
      if (data.length > 0 && !activeConversation) {
        setActiveConversation(data[0]);
      }
      return data;
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const data = await api.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const conv = await api.createConversation('New Chat', model);
      setConversations([conv, ...conversations]);
      setActiveConversation(conv);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const project = await api.createProject(newProjectName.trim());
      setProjects([...projects, project]);
      setNewProjectName('');
      setShowNewProject(false);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    }
  };

  const handleAssignToProject = async (conversationId, projectId) => {
    try {
      await api.assignConversationToProject(conversationId, projectId);
      const freshConversations = await loadConversations();

      // Update activeConversation with fresh data
      if (activeConversation?.id === conversationId) {
        const updated = freshConversations.find(c => c.id === conversationId);
        if (updated) {
          setActiveConversation(updated);
        }
      }
    } catch (error) {
      console.error('Failed to assign conversation:', error);
      alert('Failed to assign conversation to project');
    }
  };

  // Title editing functions
  const startEditingTitle = () => {
    if (!activeConversation) return;
    setEditedTitle(activeConversation.title);
    setEditingTitle(true);
  };

  const cancelEditingTitle = () => {
    setEditingTitle(false);
    setEditedTitle('');
  };

  const saveTitle = async () => {
    if (!activeConversation || !editedTitle.trim()) {
      cancelEditingTitle();
      return;
    }

    try {
      const updated = await api.updateConversationTitle(activeConversation.id, editedTitle.trim());
      setActiveConversation(updated);
      setConversations(prev =>
        prev.map(c => c.id === updated.id ? updated : c)
      );
      setEditingTitle(false);
    } catch (error) {
      console.error('Failed to update title:', error);
      alert('Failed to update title');
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelEditingTitle();
    }
  };

  // Sidebar title editing
  const startEditingSidebarTitle = (conv, e) => {
    e.stopPropagation();
    setEditingSidebarId(conv.id);
    setEditedSidebarTitle(conv.title);
  };

  const cancelEditingSidebarTitle = () => {
    setEditingSidebarId(null);
    setEditedSidebarTitle('');
  };

  const saveSidebarTitle = async (convId) => {
    if (!editedSidebarTitle.trim()) {
      cancelEditingSidebarTitle();
      return;
    }

    try {
      const updated = await api.updateConversationTitle(convId, editedSidebarTitle.trim());
      setConversations(prev =>
        prev.map(c => c.id === updated.id ? updated : c)
      );
      if (activeConversation && activeConversation.id === convId) {
        setActiveConversation(updated);
      }
      cancelEditingSidebarTitle();
    } catch (error) {
      console.error('Failed to update title:', error);
      alert('Failed to update title');
    }
  };

  const handleSidebarTitleKeyDown = (e, convId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveSidebarTitle(convId);
    } else if (e.key === 'Escape') {
      cancelEditingSidebarTitle();
    }
  };

  const deleteConversation = async (id) => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversation?.id === id) {
        const remaining = conversations.filter(c => c.id !== id);
        setActiveConversation(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || !activeConversation) return;

    const messageText = input;
    setInput('');
    setLoading(true);

    try {
      await api.sendMessage(activeConversation.id, messageText, model, uploadedFileIds);
      setUploadedFileIds([]);
      setSelectedFiles([]);
      await loadMessages(activeConversation.id);
      await loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = async (files) => {
    setSelectedFiles(Array.from(files));
    
    try {
      const uploadedIds = [];
      for (const file of files) {
        const response = await api.uploadFile(file);
        uploadedIds.push(response.id);
      }
      setUploadedFileIds(uploadedIds);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload files: ' + error.message);
      setSelectedFiles([]);
      setUploadedFileIds([]);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedFileIds(prev => prev.filter((_, i) => i !== index));
  };

  const handleExportConversation = async (conversationId, format) => {
    try {
      await api.exportConversation(conversationId, format);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export conversation: ' + error.message);
    }
  };

  const handleGenerateReport = async () => {
    try {
      await api.generateGlobalReport();
    } catch (error) {
      console.error('Report generation failed:', error);
      alert('Failed to generate report: ' + error.message);
    }
  };

  // Search functions
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSearchActive(query.trim().length > 0);
    setCurrentMatchIndex(0);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        navigateToPrevMatch();
      } else {
        navigateToNextMatch();
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setSearchActive(false);
    }
  };

  const highlightMatches = () => {
    clearHighlights();
    
    if (!searchQuery.trim()) return;

    const container = document.getElementById('messages-container');
    if (!container) return;

    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let matchCount = 0;

    Object.values(messageRefs.current).forEach((element) => {
      if (!element) return;

      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const textNodes = [];
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }

      textNodes.forEach((node) => {
        const text = node.textContent;
        if (!regex.test(text)) return;

        const span = document.createElement('span');
        span.innerHTML = text.replace(regex, (match) => {
          matchCount++;
          return `<mark class="search-highlight" data-match-index="${matchCount - 1}">${match}</mark>`;
        });

        node.parentNode.replaceChild(span, node);
      });
    });

    setTotalMatches(matchCount);

    if (matchCount > 0) {
      scrollToMatch(0);
    }
  };

  const clearHighlights = () => {
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach((mark) => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });

    const activeHighlights = document.querySelectorAll('.search-highlight-active');
    activeHighlights.forEach((mark) => {
      mark.classList.remove('search-highlight-active');
    });

    setTotalMatches(0);
    setCurrentMatchIndex(0);
  };

  const scrollToMatch = (index) => {
    const marks = document.querySelectorAll('.search-highlight');
    if (marks.length === 0) return;

    marks.forEach(m => m.classList.remove('search-highlight-active'));

    const targetMark = marks[index];
    if (targetMark) {
      targetMark.classList.add('search-highlight-active');
      targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const navigateToNextMatch = () => {
    if (totalMatches === 0) return;
    const nextIndex = (currentMatchIndex + 1) % totalMatches;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(nextIndex);
  };

  const navigateToPrevMatch = () => {
    if (totalMatches === 0) return;
    const prevIndex = currentMatchIndex === 0 ? totalMatches - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(prevIndex);
  };

  const formatCost = (cost) => {
    if (cost === null || cost === undefined || isNaN(cost)) return 'N/A';
    if (cost === 0) return 'FREE 🎉';
    return `$${Number(cost).toFixed(6)}`;
  };

  const formatTokens = (tokens) => {
    if (tokens === null || tokens === undefined || isNaN(tokens)) return '0';
    const numTokens = Number(tokens);
    if (numTokens >= 1000) {
      return `${(numTokens / 1000).toFixed(1)}k`;
    }
    return Math.round(numTokens).toString();
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <style jsx global>{`
        .search-highlight {
          background-color: #fbbf24;
          color: #000;
          padding: 0 2px;
          border-radius: 2px;
        }
        .search-highlight-active {
          background-color: #f97316;
          color: #fff;
        }
      `}</style>

      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={createNewConversation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Projects Section */}
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-400">PROJECTS</h3>
            <button
              onClick={() => setShowNewProject(!showNewProject)}
              className="text-gray-400 hover:text-white transition"
              title="New project"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {showNewProject && (
            <form onSubmit={handleCreateProject} className="mb-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name..."
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </form>
          )}

          <div className="space-y-1 max-h-32 overflow-y-auto">
            {projects.map(project => (
              <div key={project.id} className="text-sm text-gray-300 px-2 py-1 hover:bg-gray-700 rounded cursor-pointer">
                📁 {project.name}
              </div>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`group px-4 py-3 cursor-pointer transition ${
                activeConversation?.id === conv.id
                  ? 'bg-gray-700 border-l-4 border-blue-500'
                  : 'hover:bg-gray-700/50'
              }`}
              onClick={() => setActiveConversation(conv)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {editingSidebarId === conv.id ? (
                    <input
                      ref={sidebarInputRef}
                      type="text"
                      value={editedSidebarTitle}
                      onChange={(e) => setEditedSidebarTitle(e.target.value)}
                      onKeyDown={(e) => handleSidebarTitleKeyDown(e, conv.id)}
                      onBlur={() => saveSidebarTitle(conv.id)}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className="text-sm font-medium truncate">{conv.title}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {conv.message_count || 0} messages • {formatCost(conv.total_cost || 0)}
                      </div>
                    </>
                  )}
                </div>
                {editingSidebarId !== conv.id && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startEditingSidebarTitle(conv, e)}
                      className="p-1 hover:bg-gray-600 rounded"
                      title="Rename"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="p-1 hover:bg-red-600 rounded"
                      title="Delete"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeConversation && (
                <>
                  {editingTitle ? (
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={handleTitleKeyDown}
                      onBlur={saveTitle}
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <>
                      <h1 className="text-xl font-semibold">{activeConversation.title}</h1>
                      <button
                        onClick={startEditingTitle}
                        className="p-1 hover:bg-gray-700 rounded transition"
                        title="Edit title"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </>
                  )}

                  {projects.length > 0 && (
                    <select
                      value={activeConversation.project_id || ''}
                      onChange={(e) => handleAssignToProject(activeConversation.id, e.target.value || null)}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                    >
                      <option value="">No Project</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>📁 {p.name}</option>
                      ))}
                    </select>
                  )}

                  {messages.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white text-sm rounded-lg transition flex items-center gap-2"
                        title="Export conversation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showExportMenu && (
                        <div className="absolute top-full mt-1 right-0 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50 min-w-[150px]">
                          <button
                            onClick={() => {
                              handleExportConversation(activeConversation.id, 'markdown');
                              setShowExportMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-600 text-sm first:rounded-t-lg"
                          >
                            📝 Markdown
                          </button>
                          <button
                            onClick={() => {
                              handleExportConversation(activeConversation.id, 'json');
                              setShowExportMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-600 text-sm last:rounded-b-lg"
                          >
                            📦 JSON
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.cost})
                  </option>
                ))}
              </select>
              <button
                onClick={handleGenerateReport}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition flex items-center gap-2"
                title="Generate global usage report (CSV)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Report
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {messages.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search in conversation... (Enter to navigate, Esc to clear)"
                className="flex-1 bg-transparent border-none focus:outline-none text-sm"
              />
              {totalMatches > 0 && (
                <>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {currentMatchIndex + 1} of {totalMatches}
                  </span>
                  <button
                    onClick={navigateToPrevMatch}
                    className="p-1 hover:bg-gray-600 rounded"
                    title="Previous match (Shift+Enter)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={navigateToNextMatch}
                    className="p-1 hover:bg-gray-600 rounded"
                    title="Next match (Enter)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </>
              )}
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchActive(false);
                  }}
                  className="p-1 hover:bg-gray-600 rounded"
                  title="Clear search (Esc)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div id="messages-container" className="flex-1 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              ref={el => messageRefs.current[msg.id || idx] = el}
              className={`border-b border-gray-800 ${
                msg.role === 'user'
                  ? 'bg-gray-800/50'
                  : 'bg-gray-900'
              }`}
            >
              <div className="max-w-[90%] mx-auto px-6 py-6">
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-blue-600 rounded-2xl px-5 py-3 max-w-2xl">
                      {msg.files && msg.files.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {msg.files.map((file, fileIdx) => (
                            <div key={fileIdx} className="text-xs bg-blue-700 rounded px-2 py-1 flex items-center gap-1">
                              <span>{file.original_filename || file.filename}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-white whitespace-pre-wrap break-words text-xl">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      className="prose prose-xl prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-100 max-w-none prose-p:leading-relaxed prose-headings:font-semibold"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(msg.content || '')
                      }}
                    />
                    {(msg.cost !== null && msg.cost !== undefined) && (
                      <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t border-gray-800">
                        <span>{formatCost(msg.cost)}</span>
                        <span>•</span>
                        <span>{formatTokens(msg.input_tokens)} in</span>
                        <span>•</span>
                        <span>{formatTokens(msg.output_tokens)} out</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="border-b border-gray-800 bg-gray-900">
              <div className="max-w-[90%] mx-auto px-6 py-6">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <div className="max-w-[90%] mx-auto">
            <FileUpload
              onFilesSelected={handleFilesSelected}
              selectedFiles={selectedFiles}
              onRemoveFile={handleRemoveFile}
            />
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Claude..."
                disabled={loading || !activeConversation}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !activeConversation || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
