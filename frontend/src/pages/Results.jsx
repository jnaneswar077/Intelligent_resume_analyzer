import MatchResults from '../components/MatchResults';
import Suggestions from '../components/Suggestions';

export default function Results({ data, onRestart }) {
  if (!data) return null;
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Results</h2>
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={onRestart}>Run Again</button>
      </div>
      <div className="grid gap-6">
        <MatchResults topRoles={data.top_roles} ats={data.ats_score} />
        <Suggestions shortText={data.suggestions_short} skills={data.extracted_skills} missing={data.missing_skills_union} />
      </div>
    </div>
  );
}


