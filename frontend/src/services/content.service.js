import apiClient from './api';

const ContentService = {
  /**
   * Submit text content for AI moderation.
   * @param {string} body - The text content
   */
  submitText: async (body) => {
    const response = await apiClient.post('/contents', {
      type: 'TEXT',
      body,
    });
    return response.data;
  },

  /**
   * Submit image metadata for AI moderation.
   * @param {File} file - The actual image file object
   */
  submitImage: async (file) => {
    const formData = new FormData();
    formData.append('type', 'IMAGE');
    formData.append('image', file);

    const response = await apiClient.post('/contents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get all contents submitted by the current user.
   */
  getMyContents: async () => {
    const response = await apiClient.get('/contents/me');
    return response.data;
  },

  /**
   * Get a specific content by ID.
   */
  getContentById: async (id) => {
    const response = await apiClient.get(`/contents/${id}`);
    return response.data;
  },
};

export default ContentService;
