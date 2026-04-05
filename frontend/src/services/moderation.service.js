import apiClient from './api';

const ModerationService = {
  /**
   * Get the moderation queue (content items with FLAGGED status).
   * Only accessible by MODERATOR.
   */
  getQueue: async (params = {}) => {
    const response = await apiClient.get('/api/moderation/queue', { params });
    return response.data;
  },

  /**
   * Take a moderation action (Approve or Reject).
   * @param {number} contentId - The ID of the content to moderate
   * @param {'APPROVE' | 'REJECT'} action - The action to perform
   * @param {string} [reason] - Optional reason for the action
   */
  takeAction: async (contentId, action, reason) => {
    const response = await apiClient.post('/api/moderation/action', {
      contentId,
      action,
      reason,
    });
    return response.data;
  },

  /**
   * Get all content history.
   * Only accessible by MODERATOR.
   */
  getAllHistory: async (params = {}) => {
    const response = await apiClient.get('/api/moderation/history', { params });
    return response.data;
  },
};

export default ModerationService;
