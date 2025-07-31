import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  updateAvailability: (availability) => api.put('/auth/availability', { availability }),
};

// Issues API
export const issuesAPI = {
  getAll: (params = {}) => api.get('/issues', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  create: (issueData) => api.post('/issues', issueData),
  update: (id, issueData) => api.put(`/issues/${id}`, issueData),
  delete: (id) => api.delete(`/issues/${id}`),
  getHelperSuggestions: (id) => api.get(`/issues/${id}/helpers`),
  assign: (id, assignedTo) => api.put(`/issues/${id}/assign`, { assignedTo }),
  addComment: (id, commentData) => api.post(`/issues/${id}/comments`, commentData),
  resolve: (id, resolutionData) => api.put(`/issues/${id}/resolve`, resolutionData),
  vote: (id, voteType) => api.post(`/issues/${id}/vote`, { voteType }),
};

// Users API
export const usersAPI = {
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getUserIssues: (id, params = {}) => api.get(`/users/${id}/issues`, { params }),
  updateSkills: (id, skills) => api.put(`/users/${id}/skills`, { skills }),
  verifySkill: (id, skillName) => api.put(`/users/${id}/skills/${skillName}/verify`),
  getStats: (id) => api.get(`/users/${id}/stats`),
  getTopContributors: (params = {}) => api.get('/users/top-contributors', { params }),
  searchBySkills: (params = {}) => api.get('/users/search/skills', { params }),
};

// Health check
export const healthAPI = {
  check: () => axios.get('http://localhost:5000/health'),
};

export default api; 