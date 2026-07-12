// src/config/api.js

const API_URL = 'https://eduspantech-backend.onrender.com';
export const API = {
  baseURL: API_BASE_URL,
  
  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    logout: `${API_BASE_URL}/auth/logout`,
    refresh: `${API_BASE_URL}/auth/refresh`,
    me: `${API_BASE_URL}/auth/me`,
    shiftCheck: `${API_BASE_URL}/auth/shift/check`,
  },
  
  // Content endpoints
  content: {
    subjects: `${API_BASE_URL}/content/subjects`,
    subject: (id) => `${API_BASE_URL}/content/subjects/${id}`,
    subjectByName: (name) => `${API_BASE_URL}/content/subjects/name/${name}`,
    syllabus: (subjectId) => `${API_BASE_URL}/content/syllabus/${subjectId}`,
    enroll: (subjectId) => `${API_BASE_URL}/content/subjects/${subjectId}/enroll`,
    mySubjects: `${API_BASE_URL}/content/my/subjects`,
  },
  
  // Subscription endpoints
  subscription: {
    me: `${API_BASE_URL}/subscription/me`,
    create: `${API_BASE_URL}/subscription/create`,
    cancel: `${API_BASE_URL}/subscription/cancel`,
    eligibility: `${API_BASE_URL}/subscription/eligibility`,
  },
  
  // Session endpoints
  session: {
    start: `${API_BASE_URL}/session/start`,
    end: (id) => `${API_BASE_URL}/session/end/${id}`,
    history: `${API_BASE_URL}/session/history`,
  },
  
  // Dashboard endpoints
  dashboard: {
    overview: `${API_BASE_URL}/dashboard`,
  },
  
  // Payment endpoints
  payment: {
    create: `${API_BASE_URL}/payment/create`,
    verify: `${API_BASE_URL}/payment/verify`,
    history: `${API_BASE_URL}/payment/history`,
  },
};

export default API;