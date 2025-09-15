import { useEffect, useState } from 'react';
import ResumeUpload from '../components/ResumeUpload';
import RoleSelector from '../components/RoleSelector';
import { api } from '../services/api';

export default function Analysis({ onDone }) {
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getRoles().then(setRoles).catch(() => setRoles({}));
  }, []);

  async function handleAnalyze({ file, category, role, jd }) {
    setLoading(true);
    try {
      const res = await api.uploadAndAnalyze({ file, category, selected_role: role, job_description: jd });
      onDone(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <RoleSelector roles={roles} onAnalyze={handleAnalyze} loading={loading} />
      <ResumeUpload onAnalyze={handleAnalyze} roles={roles} loading={loading} />
    </div>
  );
}


