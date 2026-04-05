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
   * @param {string} filename - The file name
   * @param {string} mimeType - e.g. 'image/jpeg'
   * @param {number} sizeBytes - File size in bytes
   */
  submitImage: async (filename, mimeType, sizeBytes) => {
    const response = await apiClient.post('/contents', {
      type: 'IMAGE',
      filename,
      mimeType,
      sizeBytes,
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
