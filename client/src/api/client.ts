import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let activeRequests = 0;

function startLoading() {
  if (activeRequests === 0) {
    window.dispatchEvent(new CustomEvent('api-loading-start'));
  }
  activeRequests++;
}

function stopLoading() {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    window.dispatchEvent(new CustomEvent('api-loading-end'));
  }
}

// Attach JWT token to every request if available
apiClient.interceptors.request.use((config) => {
  startLoading();
  const token = localStorage.getItem('greenleaf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  stopLoading();
  return Promise.reject(error);
});

// Handle responses globally
apiClient.interceptors.response.use(
  (response) => {
    stopLoading();
    return response;
  },
  (error) => {
    stopLoading();
    if (error.response?.status === 401) {
      localStorage.removeItem('greenleaf_token');
      localStorage.removeItem('greenleaf_user');
      // Only redirect if we're on an admin page
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
