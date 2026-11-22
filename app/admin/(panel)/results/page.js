import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getCurrent } from '@/lib/academic';
import { SubmissionPill } from '@/components/Status';
import { TERM_NAMES, fmtDateTime } from '@/lib/utils';

export const metadata = { title: 'Results', robots: { index: false, follow: false } };

export default async function ResultsAdmin({ searchParams }) {
  await requireUser('ADMIN');
  const { session: cur, term: curTerm } = await getCurrent();
  const sp = searchParams || {};
  // No filter in the address = current session and term. An empty choice = all.
  const sessionId = sp.session === undefined ? cur?.id || '' : String(sp.session);
  const termNumber = sp.term === undefined ? (curTerm ? String(curTerm.number) : '') : String(sp.term);
  const classId = String(sp.classId || ''), teacherId = String(sp.teacherId || ''), subjectId = String(sp.subjectId || ''), status = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].includes(sp.status) ? sp.status : '';

  const where = {
    ...(classId ? { classId } : {}), ...(teacherId ? { teacherId } : {}), ...(subjectId ? { subjectId } : {}),
    ...(status ? { status } : {}),
    ...(sessionId || termNumber ? { term: { ...(sessionId ? { sessionId } : {}), ...(termNumber ? { number: Number(termNumber) } : {}) } } : {}),
  };
  const [classes, teachers, subjects, sessions, subs] = await Promise.all([
    prisma.schoolClass.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.teacher.findMany({ orderBy: { displayName: 'asc' } }),
    prisma.subject.findMany({ orderBy: { name: 'asc' } }),
    prisma.academicSession.findMany({ orderBy: { name: 'desc' } }),
    prisma.resultSubmission.findMany({
      where, orderBy: { updatedAt: 'desc' }, take: 300,
      include: { class: true, subject: true, teacher: true, term: { include: { session: true } }, _count: { select: { results: true } } },
    }),
  ]);

  return (
    <>
      <div className="page-title"><h1>Results</h1><p>Review, approve, reject and publish results submitted by teachers.</p></div>
      <div className="panel">
        <form method="get" className="toolbar">
          <label className="field"><span className="lbl">Session</span><select name="session" defaultValue={sessionId}><option value="">All sessions</option>{sessions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></label>
          <label className="field"><span className="lbl">Term</span><select name="term" defaultValue={termNumber}><option value="">All terms</option>{[1, 2, 3].map((n) => (<option key={n} value={n}>{TERM_NAMES[n]}</option>))}</select></label>
          <label className="field"><span className="lbl">Class</span><select name="classId" defaultValue={classId}><option value="">All classes</option>{classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></label>
          <label className="field"><span className="lbl">Teacher</span><select name="teacherId" defaultValue={teacherId}><option value="">All teachers</option>{teachers.map((t) => (<option key={t.id} value={t.id}>{t.displayName}</option>))}</select></label>
          <label className="field"><span className="lbl">Subject</span><select name="subjectId" defaultValue={subjectId}><option value="">All subjects</option>{subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></label>
          <label className="field"><span className="lbl">Status</span>
            <select name="status" defaultValue={status}><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="PENDING">Pending approval</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select>
          </label>
          <button className="btn btn-outline" type="submit">Filter</button>
          <Link href="/admin/results" className="btn btn-ghost">Reset</Link>
        </form>
        {subs.length === 0 ? (
          <div className="empty"><strong>No results match</strong>Change the filters, or wait for teachers to submit results.</div>
        ) : (
          <div className="table-wrap"><table className="rtable">
            <thead><tr><th>Class</th><th>Subject</th><th>Teacher</th><th>Session and term</th><th>Status</th><th>Updated</th><th></th></tr></thead>
            <tbody>{subs.map((s) => (
              <tr key={s.id}>
                <td data-label="Class"><strong>{s.class.name}</strong></td><td data-label="Subject">{s.subject.name}</td><td data-label="Teacher">{s.teacher.displayName}</td>
                <td data-label="Session and term">{s.term.session.name}, {TERM_NAMES[s.term.number]}</td>
                <td data-label="Status" className="wide"><SubmissionPill status={s.status} published={s.published} /></td>
                <td data-label="Updated">{fmtDateTime(s.updatedAt)}</td>
                <td><Link className="btn btn-small btn-outline" href={`/admin/results/${s.id}`}>{s.status === 'PENDING' ? 'Review' : 'Open'}</Link></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
