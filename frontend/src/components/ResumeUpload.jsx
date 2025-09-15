import { useState } from 'react';

export default function ResumeUpload({ onAnalyze, roles, loading }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('');
  const [role, setRole] = useState('');
  const [jd, setJd] = useState('');

  const categories = Object.keys(roles || {});
  const roleList = category ? Object.keys(roles[category] || {}) : [];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || !category) return;
    await onAnalyze({ file, category, role, jd });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
      <h3 className="text-lg font-medium">Upload Resume</h3>
      <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Category</label>
          <select className="border rounded p-2 w-full" value={category} onChange={(e) => { setCategory(e.target.value); setRole(''); }}>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Role (optional)</label>
          <select className="border rounded p-2 w-full" value={role} onChange={(e) => setRole(e.target.value)} disabled={!category}>
            <option value="">Select role</option>
            {roleList.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Job Description (optional)</label>
        <textarea className="border rounded p-2 w-full" rows={4} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste JD here"></textarea>
      </div>

      <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit" disabled={loading}>{loading ? 'Analyzing...' : 'Analyze'}</button>
    </form>
  );
}


