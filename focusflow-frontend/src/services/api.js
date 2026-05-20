// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class FocusFlowAPI {
  constructor() {
    this.conversationId = localStorage.getItem('conversation_id') || null;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Chat endpoints
  async sendMessage(message) {
    const response = await this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message, 
        conversation_id: this.conversationId 
      }),
    });
    
    if (response.conversation_id) {
      this.conversationId = response.conversation_id;
      localStorage.setItem('conversation_id', response.conversation_id);
    }
    
    return response;
  }

  async getSuggestions() {
    return this.request('/chat/suggestions');
  }

  async clearConversation() {
    this.conversationId = null;
    localStorage.removeItem('conversation_id');
    return { success: true };
  }

  // Task endpoints
  async getTasks() {
    return this.request('/tasks');
  }

  async createTask(task) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(taskId, updates) {
    return this.request(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(taskId) {
    return this.request(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Focus endpoints
  async startFocus(durationMinutes = 25, taskId = null) {
    return this.request('/focus/start', {
      method: 'POST',
      body: JSON.stringify({ duration_minutes: durationMinutes, task_id: taskId }),
    });
  }

  async pauseFocus() {
    return this.request('/focus/pause', { method: 'POST' });
  }

  async resumeFocus() {
    return this.request('/focus/resume', { method: 'POST' });
  }

  async stopFocus() {
    return this.request('/focus/stop', { method: 'POST' });
  }

  async getFocusStats() {
    return this.request('/focus/stats');
  }

  // Document endpoints
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  }

  async getDocuments() {
    return this.request('/documents');
  }

  async deleteDocument(docId) {
    return this.request(`/documents/${docId}`, { method: 'DELETE' });
  }

  async searchDocuments(query) {
    return this.request(`/documents/search?query=${encodeURIComponent(query)}`);
  }

  // Analytics
  async getAnalytics() {
    return this.request('/analytics/stats');
  }

  async getWeeklyStats() {
    return this.request('/analytics/weekly');
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new FocusFlowAPI();