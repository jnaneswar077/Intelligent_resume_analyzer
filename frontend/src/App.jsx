import { useState } from 'react';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import Results from './pages/Results';

export default function App() {
  const [route, setRoute] = useState('home');
  const [analysisData, setAnalysisData] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {route === 'home' && (
        <Home onStart={() => setRoute('analysis')} />
      )}
      {route === 'analysis' && (
        <Analysis onDone={(data) => { setAnalysisData(data); setRoute('results'); }} />
      )}
      {route === 'results' && (
        <Results data={analysisData} onRestart={() => setRoute('analysis')} />
      )}
    </div>
  )
}


