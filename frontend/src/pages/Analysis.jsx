import { useEffect, useState } from 'react';
import ResumeUpload from '../components/ResumeUpload';
import { api } from '../services/api';

export default function Analysis({ onDone }) {
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getRoles().then(setRoles).catch(() => setRoles({}));
  }, []);

  async function handleAnalyze({ file, category, jd }) {
    setLoading(true);
    try {
      const res = await api.uploadAndAnalyze({ file, category, job_description: jd });
      onDone(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section">
      <div className="card">
        <div className="card-body">
          <h2 className="text-2xl font-semibold mb-4">Upload & Select</h2>
          <ResumeUpload onAnalyze={handleAnalyze} roles={roles} loading={loading} />
        </div>
      </div>
    </div>
  );
}


