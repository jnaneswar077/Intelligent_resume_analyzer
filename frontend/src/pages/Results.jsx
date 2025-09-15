import MatchResults from '../components/MatchResults';
import Suggestions from '../components/Suggestions';
import { useState } from 'react';
import { api } from '../services/api';

export default function Results({ data, onRestart }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingRoleKey, setLoadingRoleKey] = useState('');
  if (!data) return null;

  async function handleSelectRole(r) {
    const key = `${r.category}-${r.role}`;
    setLoading(true);
    setLoadingRoleKey(key);
    try {
      const res = await api.getDetailedAnalysis({ resume_id: data.resume_id, category: r.category, role: r.role });
      setDetail(res);
    } finally {
      setLoading(false);
      setLoadingRoleKey('');
    }
  }
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Results</h2>
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={onRestart}>Run Again</button>
      </div>
      <div className="grid gap-6">
        <MatchResults topRoles={data.top_roles} ats={data.ats_score} onSelectRole={handleSelectRole} loadingRoleKey={loadingRoleKey} />
        <Suggestions shortText={data.suggestions_short} skills={data.extracted_skills} missing={data.missing_skills_union} />
        {detail && (
          <div className="p-4 bg-white rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Detailed Analysis</h3>
              {loading && <span className="text-sm text-gray-500">Loading...</span>}
            </div>
            {detail.llm_polished_text && (
              <div className="prose max-w-none mb-4 whitespace-pre-wrap text-sm text-gray-800">
                {detail.llm_polished_text}
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="font-semibold mb-1">Strengths</div>
                <ul className="list-disc list-inside text-sm text-gray-800">{(detail.strengths||[]).map((s,i)=>(<li key={i}>{s}</li>))}</ul>
              </div>
              <div>
                <div className="font-semibold mb-1">Weaknesses</div>
                <ul className="list-disc list-inside text-sm text-gray-800">{(detail.weaknesses||[]).map((s,i)=>(<li key={i}>{s}</li>))}</ul>
              </div>
            </div>
            <div className="mt-4">
              <div className="font-semibold mb-1">Actionable Recommendations</div>
              <ul className="list-disc list-inside text-sm text-gray-800">{(detail.actionable_recs||[]).map((s,i)=>(<li key={i}>{s}</li>))}</ul>
            </div>
            <div className="mt-4">
              <div className="font-semibold mb-1">Example Bullets</div>
              <ul className="list-disc list-inside text-sm text-gray-800">{(detail.example_bullets||[]).map((s,i)=>(<li key={i}>{s}</li>))}</ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


