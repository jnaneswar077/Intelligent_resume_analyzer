import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

async function getRoles() {
  const res = await axios.get(`${BASE}/roles`);
  return res.data;
}

async function uploadAndAnalyze({ file, category, selected_role, job_description }) {
  const form = new FormData();
  form.append('file', file);
  form.append('category', category);
  if (selected_role) form.append('selected_role', selected_role);
  if (job_description) form.append('job_description', job_description);
  const res = await axios.post(`${BASE}/upload_and_analyze`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export const api = { getRoles, uploadAndAnalyze };


