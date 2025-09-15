export default function Home({ onStart }) {
  return (
    <div className="section">
      <div className="card">
        <div className="card-body">
          <h1 className="heading-xl mb-3">Resume Analyzer</h1>
          <p className="subtext mb-6">Upload your resume, select a role, and get an ATS-style analysis with suggestions.</p>
          <button className="btn-primary" onClick={onStart}>Get Started</button>
        </div>
      </div>
    </div>
  );
}


