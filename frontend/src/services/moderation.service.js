import apiClient from './api';

const ModerationService = {
  /**
   * Get the moderation queue (content items with FLAGGED status).
   * Only accessible by MODERATOR.
   */
  getQueue: async (params = {}) => {
    const response = await apiClient.get('/moderation/queue', { params });
    return response.data;
  },

  /**
   * Take a moderation action (Approve or Reject).
   * @param {number} contentId - The ID of the content to moderate
   * @param {'APPROVE' | 'REJECT'} action - The action to perform
   * @param {string} [reason] - Optional reason for the action
   */
  takeAction: async (contentId, action, reason) => {
    const response = await apiClient.post('/moderation/action', {
      contentId,
      action,
      reason,
    });
    return response.data;
  },

  /**
   * Get moderation statistics for charts.
   * Only accessible by MODERATOR.
   */
  getStats: async () => {
    const response = await apiClient.get('/moderation/stats');
    return response.data;
  },

  /**
   * Retrieves all content history with pagination and status filters
   */
  getAllHistory: async (params) => {
    const response = await apiClient.get('/moderation/history', { params });
    return response.data;
  },

  /**
   * Establishes a Server-Sent Events connection to listen for live moderation updates
   */
  connectStream: (onMessage) => {
    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    const source = new EventSource(`${baseURL}/moderation/stream?token=${token}`);
    
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (err) {
        console.error('SSE JSON Parse error:', err);
      }
    };
    
    source.onerror = (err) => {
      console.warn('SSE stream error or disconnected. EventSource will auto-reconnect.', err);
    };

    return source;
  }
};

export default ModerationService;
