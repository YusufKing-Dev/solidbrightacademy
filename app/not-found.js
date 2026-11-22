import Link from 'next/link';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main className="auth">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1>Page not found</h1>
        <p className="sub">The page you are looking for does not exist or you do not have access to it.</p>
        <Link href="/" className="btn btn-primary">Go to the school website</Link>
      </div>
    </main>
  );
}
