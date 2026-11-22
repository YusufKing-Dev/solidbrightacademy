import { getCurrent } from '@/lib/academic';

// Reads the live session and term from the database. Never hardcoded.
export default async function CurrentTerm() {
  const { session, termName } = await getCurrent();
  if (!session || !termName) {
    return <div className="term-badge warn"><span>No academic session is active yet.</span></div>;
  }
  return (
    <div className="term-badge">
      <span><small>Academic Session</small><strong>{session.name}</strong></span>
      <span><small>Current Term</small><strong>{termName}</strong></span>
    </div>
  );
}
