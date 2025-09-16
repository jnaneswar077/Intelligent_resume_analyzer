export default function MatchResults({ topRoles, ats, onSelectRole, loadingRoleKey }) {
  return (
    <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-700">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Top Role Matches</h3>
        <p className="text-gray-300">Based on your resume content and skills analysis</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(topRoles || []).map((r, index) => {
          const key = `${r.category}-${r.role}`;
          const isLoading = loadingRoleKey === key;
          
          // Get ranking badge
          const getRankBadge = (index) => {
            if (index === 0) return { text: '#1 MATCH', bg: 'bg-yellow-500', glow: 'shadow-yellow-500/50' };
            if (index === 1) return { text: '#2 MATCH', bg: 'bg-gray-400', glow: 'shadow-gray-400/50' };
            if (index === 2) return { text: '#3 MATCH', bg: 'bg-amber-600', glow: 'shadow-amber-600/50' };
            return { text: `#${index + 1} MATCH`, bg: 'bg-gray-600', glow: 'shadow-gray-600/50' };
          };
          
          const badge = getRankBadge(index);
          
          return (
            <div key={key} className={`relative bg-gray-700 bg-opacity-50 rounded-xl p-6 border border-gray-600 hover:border-gray-500 transition-all duration-300 ${isLoading ? 'opacity-70' : 'hover:bg-opacity-70'}`}>
              {/* Ranking badge */}
              <div className={`absolute -top-3 left-4 ${badge.bg} ${badge.glow} px-3 py-1 rounded-full shadow-lg`}>
                <span className="text-xs font-bold text-white">{badge.text}</span>
              </div>
              
              {/* Content */}
              <div className="mt-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">{r.role}</h4>
                    <div className="inline-flex items-center gap-1 text-sm text-gray-400 bg-gray-600 bg-opacity-50 px-2 py-1 rounded">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H9m14 0a2 2 0 01-2 2H5a2 2 0 01-2-2m14 0V9a2 2 0 00-2-2M9 7h6m-6 4h6m-2 5h2M7 7h.01M7 11h.01M7 15h.01" />
                      </svg>
                      {r.category}
                    </div>
                  </div>
                  
                  {/* Score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white mb-1">{r.score}%</div>
                    <div className="text-xs text-gray-400">Match</div>
                  </div>
                </div>
                
                {/* Skills */}
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-400 mb-2">Key Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {(r.skills || []).slice(0, 4).map((skill, skillIndex) => (
                      <span key={skillIndex} className="text-xs px-2 py-1 bg-blue-900 bg-opacity-50 text-blue-300 rounded border border-blue-700">
                        {skill}
                      </span>
                    ))}
                    {(r.skills || []).length > 4 && (
                      <span className="text-xs px-2 py-1 bg-gray-600 bg-opacity-50 text-gray-400 rounded">
                        +{(r.skills || []).length - 4} more
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Action button */}
                {onSelectRole && (
                  <button 
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      isLoading 
                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:shadow-lg transform hover:scale-105'
                    }`}
                    disabled={isLoading} 
                    onClick={() => onSelectRole(r)}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Get Detailed Analysis
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}


