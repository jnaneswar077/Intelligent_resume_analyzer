import { useState, useRef } from 'react';

export default function ResumeUpload({ onAnalyze, roles, loading }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('');
  const [jd, setJd] = useState('');
  const inputRef = useRef(null);

  const categories = Object.keys(roles || {});
  const roleList = category ? Object.keys(roles[category] || {}) : [];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || !category) return;
    await onAnalyze({ file, category, jd });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]); }}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <div className="text-sm text-gray-700">
          {file ? (
            <span>Selected file: <span className="font-medium">{file.name}</span></span>
          ) : (
            <span>Drag & drop your resume here, or click to browse (.pdf, .docx)</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1 font-medium">Category</label>
          <select className="border rounded-md p-2 w-full bg-white" value={category} onChange={(e) => { setCategory(e.target.value); }}>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium">Available Roles</label>
          <div className="border rounded-md p-2 w-full min-h-[42px] bg-gray-50 text-sm overflow-hidden text-ellipsis">
            {category && roleList.length > 0 ? roleList.join(', ') : <span className="text-gray-500">Select a category to see roles</span>}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1 font-medium">Job Description (optional)</label>
        <textarea className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200" rows={6} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste JD here"></textarea>
        <div className="text-xs text-gray-500 mt-1">Tip: Pasting 80–120 words helps the ATS score and detailed analysis.</div>
      </div>

      <button className="btn-primary" type="submit" disabled={loading || !file || !category}>{loading ? 'Analyzing...' : 'Analyze'}</button>
    </form>
  );
}


