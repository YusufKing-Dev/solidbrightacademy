import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getCurrent } from '@/lib/academic';
import ActionForm from '@/components/ActionForm';
import ActionButton from '@/components/ActionButton';
import { createAcademicSession, renameAcademicSession, setCurrentPeriod, deleteAcademicSession } from '@/lib/actions/admin-academic';
import { TERM_NAMES } from '@/lib/utils';

export const metadata = { title: 'Session and Term', robots: { index: false, follow: false } };

export default async function Sessions() {
  await requireUser('ADMIN');
  const { session: cur, term, termName } = await getCurrent();
  const sessions = await prisma.academicSession.findMany({ orderBy: { name: 'desc' }, include: { terms: { orderBy: { number: 'asc' } } } });
  return (
    <>
      <div className="page-title"><h1>Session and term</h1><p>The current session and term control the whole system.</p></div>

      <div className="panel">
        <h2>Current period</h2>
        {cur ? <p><strong>{cur.name}, {termName}</strong></p> : <div className="notice warn">No current session is set.</div>}
        {sessions.length > 0 && (
          <ActionForm action={setCurrentPeriod} submit="Set as current" className="toolbar">
            <label className="field"><span className="lbl">Session</span><select name="sessionId" defaultValue={cur?.id}>{sessions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></label>
            <label className="field"><span className="lbl">Term</span><select name="termNumber" defaultValue={term?.number || 1}>{[1, 2, 3].map((n) => (<option key={n} value={n}>{TERM_NAMES[n]}</option>))}</select></label>
          </ActionForm>
        )}
      </div>

      <div className="panel">
        <h2>Create a session</h2>
        <ActionForm action={createAcademicSession} submit="Create session" className="toolbar" resetOnSuccess>
          <label className="field"><span className="lbl">Session name</span><input name="name" required placeholder="2026/2027" maxLength={9} /></label>
        </ActionForm>
        <p className="muted small">1st, 2nd and 3rd Term are created automatically.</p>
      </div>

      <div className="panel">
        <h2>All sessions</h2>
        {sessions.length === 0 ? <div className="empty"><strong>No sessions yet</strong>Create the first session above.</div> : (
          <div className="table-wrap"><table className="rtable">
            <thead><tr><th>Session</th><th>Terms</th><th>Rename</th><th></th></tr></thead>
            <tbody>{sessions.map((s) => (
              <tr key={s.id}>
                <td data-label="Session"><strong>{s.name}</strong> {s.isCurrent && <span className="pill green">Current</span>}</td>
                <td data-label="Terms">{s.terms.map((t) => (<span key={t.id} className={'pill ' + (t.isCurrent ? 'green' : 'grey')} style={{ marginRight: 6 }}>{TERM_NAMES[t.number]}{t.isCurrent ? ' (current)' : ''}</span>))}</td>
                <td data-label="Rename" className="wide"><ActionForm action={renameAcademicSession.bind(null, s.id)} submit="Rename" submitClass="btn btn-small btn-outline" className="row"><input name="name" defaultValue={s.name} maxLength={9} style={{ width: 130 }} aria-label={`New name for ${s.name}`} /></ActionForm></td>
                <td>{!s.isCurrent && <ActionButton action={deleteAcademicSession.bind(null, s.id)} className="btn btn-small btn-danger" confirm={`Delete session ${s.name}?`}>Delete</ActionButton>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
