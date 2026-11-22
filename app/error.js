'use client';

export default function Error({ reset }) {
  return (
    <main className="auth">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1>Something went wrong</h1>
        <p className="sub">Please try again. If the problem continues, contact the school administrator.</p>
        <button type="button" className="btn btn-primary" onClick={() => reset()}>Try again</button>
      </div>
    </main>
  );
}
