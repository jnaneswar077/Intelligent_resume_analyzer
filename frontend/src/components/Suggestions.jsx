export default function Suggestions({ shortText, skills, missing }) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-medium mb-2">Suggestions</h3>
      <p className="mb-3 text-gray-800">{shortText}</p>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <div className="font-semibold mb-1">Extracted Skills</div>
          <div className="text-sm text-gray-700">{(skills || []).join(', ') || '—'}</div>
        </div>
        <div>
          <div className="font-semibold mb-1">Missing Skills</div>
          <div className="text-sm text-gray-700">{(missing || []).join(', ') || '—'}</div>
        </div>
      </div>
    </div>
  );
}


