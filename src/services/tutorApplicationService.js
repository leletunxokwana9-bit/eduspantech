// src/services/tutorApplicationService.js
const API = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const tutorApplicationService = {
  async submit(payload) {
    const res = await fetch(`${API}/tutors/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async uploadFile({ file, folder }) {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const res = await fetch(`${API}/tutors/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        data: base64,
        folder
      })
    });
    return res.json();
  },

  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API}/tutors/applications?${qs}`, {
      headers: { ...authHeaders() }
    });
    return res.json();
  },

  async getOne(id) {
    const res = await fetch(`${API}/tutors/applications/${id}`, {
      headers: { ...authHeaders() }
    });
    return res.json();
  },

  async updateStatus(id, payload) {
    const res = await fetch(`${API}/tutors/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // NEW — public track application (email + ID)
  async track(email, idNumber) {
    const res = await fetch(`${API}/tutors/applications/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, id_number: idNumber })
    });
    return res.json();
  }
};