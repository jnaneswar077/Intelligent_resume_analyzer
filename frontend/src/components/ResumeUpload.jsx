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
      {/* File Upload Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]); }}
        className="border-2 border-dashed border-gray-600 rounded-lg p-8 bg-gray-700 bg-opacity-50 hover:bg-opacity-70 transition-all duration-300 cursor-pointer group"
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-opacity-30 transition-all">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-gray-300">
            {file ? (
              <span className="text-green-400">✓ Selected file: <span className="font-medium text-white">{file.name}</span></span>
            ) : (
              <span>Drag & drop your resume here, or click to browse (.pdf, .docx)</span>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm mb-2 font-medium text-gray-300">Category</label>
          <select 
            className="border border-gray-600 rounded-lg p-3 w-full bg-gray-700 bg-opacity-50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
            value={category} 
            onChange={(e) => { setCategory(e.target.value); }}
          >
            <option value="" className="bg-gray-800">Select category</option>
            {categories.map((c) => <option key={c} value={c} className="bg-gray-800">{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-2 font-medium text-gray-300">Available Roles</label>
          <div className="border border-gray-600 rounded-lg p-3 w-full min-h-[50px] bg-gray-700 bg-opacity-30 text-sm overflow-hidden text-ellipsis flex items-center">
            {category && roleList.length > 0 ? (
              <span className="text-gray-300">{roleList.join(', ')}</span>
            ) : (
              <span className="text-gray-500">Select a category to see roles</span>
            )}
          </div>
        </div>
      </div>

      {/* Job Description */}
      <div>
        <label className="block text-sm mb-2 font-medium text-gray-300">Job Description (optional)</label>
        <textarea 
          className="border border-gray-600 rounded-lg p-3 w-full bg-gray-700 bg-opacity-50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
          rows={6} 
          value={jd} 
          onChange={(e) => setJd(e.target.value)} 
          placeholder="Paste JD here"
        ></textarea>
        <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tip: Pasting 80–120 words helps the ATS score and detailed analysis.
        </div>
      </div>

      {/* Submit Button */}
      <button 
        className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
          loading || !file || !category 
            ? 'from-gray-600 to-gray-700' 
            : 'hover:from-purple-700 hover:to-blue-700 hover:shadow-lg'
        }`}
        type="submit" 
        disabled={loading || !file || !category}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </>
        ) : (
          <>
            ANALYZE
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}


