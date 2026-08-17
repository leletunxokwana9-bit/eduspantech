// src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://eduspantech-backend.onrender.com/api' 
    : 'http://localhost:5000/api');

export const API_BASE_URL = API_URL;

console.log('📋 API URL set to:', API_URL);

export const endpoints = {
  auth: {
    register: `${API_URL}/auth/register`,
    login: `${API_URL}/auth/login`,
    me: `${API_URL}/auth/me`,
    checkShift: `${API_URL}/auth/check-shift`,
    autoVerify: `${API_URL}/auth/auto-verify`,
    updateProfile: `${API_URL}/auth/profile`,
    changePassword: `${API_URL}/auth/change-password`,
    deleteAccount: `${API_URL}/auth/account`,
  },
  sessions: {
    getAll: `${API_URL}/sessions`,
    create: `${API_URL}/sessions`,
    getById: (id) => `${API_URL}/sessions/${id}`,
    cancel: (id) => `${API_URL}/sessions/${id}`,
  },
  tutors: {
    getAll: `${API_URL}/tutors`,
    available: `${API_URL}/tutors/available`,
  },
  pricing: {
    plans: `${API_URL}/pricing/plans`,
  },
  content: {
    subjects: `${API_URL}/content/subjects`,
    mySubjects: `${API_URL}/content/my/subjects`,
    resources: `${API_URL}/content/resources`,
  },
  subscriptions: {
    get: `${API_URL}/subscriptions`,
    create: `${API_URL}/subscriptions`,
    cancel: `${API_URL}/subscriptions`,
    webhook: `${API_URL}/subscriptions/webhook`,
  },
  shift: {
    status: `${API_URL}/shift-status`,
  }
};