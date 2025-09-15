export default function MatchResults({ topRoles, ats, onSelectRole, loadingRoleKey }) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Top Role Matches</h3>
        {typeof ats === 'number' && <span className="text-sm">ATS: {ats}%</span>}
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {(topRoles || []).map((r) => {
          const key = `${r.category}-${r.role}`;
          const isLoading = loadingRoleKey === key;
          return (
          <div key={key} className={`border rounded p-3 ${isLoading ? 'opacity-70' : ''}`}>
            <div className="font-semibold">{r.role}</div>
            <div className="text-sm text-gray-600">{r.category}</div>
            <div className="text-blue-700 font-semibold mt-1">{r.score}%</div>
            <div className="text-xs text-gray-700 mt-2">{(r.skills || []).slice(0,5).join(', ')}</div>
            {onSelectRole && (
              <button className="mt-3 text-sm px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60" disabled={isLoading} onClick={() => onSelectRole(r)}>
                {isLoading ? 'Analyzing…' : 'Get Detailed Analysis'}
              </button>
            )}
          </div>
          );
        })}
      </div>
    </div>
  )
}


