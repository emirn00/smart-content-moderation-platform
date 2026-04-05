import apiClient from './api';

const AuthService = {
  register: async (email, password, role) => {
    const response = await apiClient.post('/auth/register', { email, password, role });
    return response.data;
  },

  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  checkHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  }
};

export default AuthService;
