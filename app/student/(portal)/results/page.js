import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getCurrent, getScoreLimits } from '@/lib/academic';
import PrintButton from '@/components/PrintButton';
import { studentName, TERM_NAMES, SECTION_LABEL } from '@/lib/utils';

export const metadata = { title: 'Check Results', robots: { index: false, follow: false } };

export default async function StudentResults({ searchParams }) {
  const user = await requireUser('STUDENT');
  const st = user.student; // always the logged-in student, never taken from the address bar
  const sessions = await prisma.academicSession.findMany({ orderBy: { name: 'desc' } });
  const { session: cur, term: curTerm } = await getCurrent();

  const wanted = sessions.find((s) => s.id === searchParams?.session);
  const session = wanted || cur || sessions[0] || null;
  const termNumber = [1, 2, 3].includes(Number(searchParams?.term)) ? Number(searchParams.term) : curTerm?.number || 1;
  const term = session ? await prisma.term.findUnique({ where: { sessionId_number: { sessionId: session.id, number: termNumber } } }) : null;

  // Only approved AND published results of THIS student are ever loaded.
  const results = term
    ? await prisma.result.findMany({
        where: { studentId: st.id, total: { not: null }, submission: { termId: term.id, published: true, status: 'APPROVED' } },
        include: { submission: { include: { subject: true } } },
      })
    : [];
  results.sort((a, b) => a.submission.subject.name.localeCompare(b.submission.subject.name));
  const remarks = term && results.length ? await prisma.reportRemark.findUnique({ where: { studentId_termId: { studentId: st.id, termId: term.id } } }) : null;
  const limits = await getScoreLimits();

  const totalMarks = results.reduce((n, r) => n + (r.total || 0), 0);
  const average = results.length ? Math.round((totalMarks / results.length) * 10) / 10 : 0;

  return (
    <>
      <div className="page-title no-print"><h1>Check results</h1><p>Choose a session and term to see your published results.</p></div>
      <div className="panel no-print">
        <form method="get" className="toolbar">
          <label className="field"><span className="lbl">Academic session</span>
            <select name="session" defaultValue={session?.id}>{sessions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}</select>
          </label>
          <label className="field"><span className="lbl">Term</span>
            <select name="term" defaultValue={termNumber}>{[1, 2, 3].map((n) => (<option key={n} value={n}>{TERM_NAMES[n]}</option>))}</select>
          </label>
          <button className="btn btn-primary" type="submit">View results</button>
        </form>
      </div>

      <div className="panel">
        <div className="sheet-meta">
          <div><strong>Name:</strong> {studentName(st)}</div>
          <div><strong>Admission no:</strong> {st.admissionNo}</div>
          <div><strong>Class:</strong> {st.class.name} ({SECTION_LABEL[st.class.section]})</div>
          <div><strong>Session:</strong> {session ? session.name : '-'}</div>
          <div><strong>Term:</strong> {TERM_NAMES[termNumber]}</div>
        </div>

        {results.length === 0 ? (
          <div className="empty">
            <strong>No results available</strong>
            Your results for {session ? session.name : 'this session'}, {TERM_NAMES[termNumber]} are not available yet. They appear here once the school approves and publishes them.
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="rtable">
                <thead><tr><th>Subject</th><th>CA ({limits.maxCA})</th><th>Exam ({limits.maxExam})</th><th>Total ({limits.maxTotal})</th><th>Grade</th><th>Remark</th><th>Teacher’s remark</th></tr></thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id}>
                      <td data-label="Subject"><strong>{r.submission.subject.name}</strong></td>
                      <td data-label="CA">{r.ca}</td>
                      <td data-label="Exam">{r.exam}</td>
                      <td data-label="Total"><strong>{r.total}</strong></td>
                      <td data-label="Grade"><span className="pill blue">{r.grade || '-'}</span></td>
                      <td data-label="Remark">{r.remark || '-'}</td>
                      <td data-label="Teacher’s remark">{r.teacherRemark || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sheet-sum">
              <span>Subjects: {results.length}</span>
              <span>Total marks: {Math.round(totalMarks * 10) / 10}</span>
              <span>Average: {average}</span>
            </div>
            {(remarks?.classTeacherRemark || remarks?.principalRemark) && (
              <div className="remarks">
                {remarks.classTeacherRemark && <div><small>Class teacher’s remark</small>{remarks.classTeacherRemark}</div>}
                {remarks.principalRemark && <div><small>Principal’s remark</small>{remarks.principalRemark}</div>}
              </div>
            )}
            <p style={{ marginTop: 16 }}><PrintButton /></p>
          </>
        )}
      </div>
    </>
  );
}
