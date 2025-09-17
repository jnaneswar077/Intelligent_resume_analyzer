import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE || '/api';

async function getRoles() {
  const res = await axios.get(`${BASE}/roles`);
  return res.data;
}

async function uploadAndAnalyze(formData) {
  const res = await axios.post(`${BASE}/upload_and_analyze`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

async function getDetailedAnalysis({ resume_id, category, role }) {
  const payload = { resume_id, choice: { type: 'ROLE', category, role } };
  const res = await axios.post(`${BASE}/detailed_analysis`, payload);
  return res.data;
}

async function getDetailedAnalysisForJD({ resume_id, job_description }) {
  const payload = { resume_id, choice: { type: 'JD', job_description } };
  const res = await axios.post(`${BASE}/detailed_analysis`, payload);
  return res.data;
}

export const api = { getRoles, uploadAndAnalyze, getDetailedAnalysis, getDetailedAnalysisForJD };


