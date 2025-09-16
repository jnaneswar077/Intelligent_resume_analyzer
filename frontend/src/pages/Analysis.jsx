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
    <div className="min-h-screen bg-dark-blue flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI-Powered Tag */}
        <div className="inline-flex items-center gap-2 bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium mb-6">
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          AI-Powered CV Analysis
        </div>
        
        {/* Main Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
          Upload & Analyze
          <span className="block text-gray-300 text-lg sm:text-xl font-normal mt-2">
            Get your resume analyzed with AI-powered insights
          </span>
        </h1>
        
        {/* Upload Card */}
        <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-700">
          <ResumeUpload onAnalyze={handleAnalyze} roles={roles} loading={loading} />
        </div>
      </div>
    </div>
  );
}


