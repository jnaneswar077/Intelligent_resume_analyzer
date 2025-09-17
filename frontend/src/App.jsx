import { useState } from 'react';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import MultiStepAnalysis from './pages/Results';

export default function App() {
  const [route, setRoute] = useState('home');

  return (
    <div className="min-h-screen">
      {route === 'home' && (
        <Home onStart={() => setRoute('analysis')} />
      )}
      {route === 'analysis' && (
        <MultiStepAnalysis onRestart={() => setRoute('home')} />
      )}
    </div>
  )
}


