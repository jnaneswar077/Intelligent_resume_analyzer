export default function Home({ onStart }) {
  return (
    <div className="max-w-3xl mx-auto py-16">
      <h1 className="text-3xl font-bold mb-4">Resume Analyzer</h1>
      <p className="mb-8">Upload your resume, select a role, and get an ATS-style analysis with suggestions.</p>
      <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={onStart}>Get Started</button>
    </div>
  );
}


