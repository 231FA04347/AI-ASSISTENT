import axios from 'axios';

// In dev, prefer a relative base URL so CRA's `proxy` can forward to the backend
// and you don't hit CORS/port/protocol mismatches.
// For deployments where frontend/backend are on different hosts, you can set `REACT_APP_API_URL`.
// If `REACT_APP_API_URL` is present but invalid, we fall back to `/api`.
const rawApiUrl = (process.env.REACT_APP_API_URL || '').trim();

const resolveApiUrl = () => {
  if (!rawApiUrl) return '/api';

  // Allow relative paths like "/api".
  if (rawApiUrl.startsWith('/')) return rawApiUrl;

  // Validate absolute URLs like "http://localhost:5000/api".
  try {
    // eslint-disable-next-line no-new
    new URL(rawApiUrl);
    return rawApiUrl;
  } catch {
    return '/api';
  }
};

const API_URL = resolveApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Axios reports CORS failures / backend down as a generic "Network Error"
    if (error?.message === 'Network Error' && !error?.response) {
      const usingAbsolute = typeof API_URL === 'string' && API_URL.startsWith('http');
      const hint = usingAbsolute
        ? `Cannot reach backend at ${API_URL}`
        : 'Cannot reach backend (check Backend is running on port 5000)';
      return Promise.reject({ message: hint });
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Assignment APIs
export const assignmentAPI = {
  createAssignment: (data) => api.post('/assignments', data),
  getTeacherAssignments: () => api.get('/assignments/teacher'),
  getStudentAssignments: () => api.get('/assignments/student'),
  getAssignment: (id) => api.get(`/assignments/${id}`),
  updateAssignment: (id, data) => api.put(`/assignments/${id}`, data),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
  getAssignmentSubmissions: (id) => api.get(`/assignments/submissions/${id}`),
};

// Submission APIs
export const submissionAPI = {
  submitAssignment: (data) => api.post('/submissions', data),
  getStudentSubmissions: () => api.get('/submissions/my-submissions'),
  getSubmission: (id) => api.get(`/submissions/${id}`),
  requestAIFeedback: (id) => api.post(`/submissions/${id}/ai-feedback`),
  checkPlagiarism: (id) => api.post(`/submissions/${id}/plagiarism-check`),
  getPlagiarismReport: (id) => api.get(`/submissions/${id}/plagiarism-report`),
  endTestForSubmission: (id) => api.post(`/submissions/${id}/end-test`),
};

// Grade APIs
export const gradeAPI = {
  gradeSubmission: (data) => api.post('/grades', data),
  getStudentGrades: () => api.get('/grades/my-grades'),
  getGrade: (id) => api.get(`/grades/${id}`),
  getClassGrades: (assignmentId) => api.get(`/grades/class/${assignmentId}`),
  addComment: (gradeId, data) => api.post(`/grades/${gradeId}/comment`, data),
  getComments: (gradeId) => api.get(`/grades/${gradeId}/comments`),
};

// Analytics APIs
export const analyticsAPI = {
  generateAnalytics: (assignmentId) => api.post(`/analytics/${assignmentId}`),
  getAnalytics: (assignmentId) => api.get(`/analytics/${assignmentId}`),
  exportReport: (assignmentId) => api.get(`/analytics/${assignmentId}/export`, { responseType: 'blob' }),
  getDashboardAnalytics: () => api.get('/analytics/dashboard'),
  getStudentPerformance: (studentId) => api.get(`/analytics/performance/${studentId}`),
  analyzeLearningOutcomes: (assignmentId) => api.get(`/analytics/${assignmentId}/learning-outcomes`),
};

export default api;
