import axios from 'axios';

// Vite üzerinden ortam değişkenine erişim.
// Eğer ortam değişkeni bulunamazsa varsayılan olarak localhost:5001 kullanılır.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek yapılmadan önce her seferinde lokaldeki token'ı kontrol edip header'a ekler
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;
