import { prisma } from '@/lib/db';
import ActionButton from '@/components/ActionButton';
import { resetAttempt } from '@/lib/actions/cbt';
import { finalizeExpired, pct } from '@/lib/cbt';
import { studentName, fmtDateTime } from '@/lib/utils';

// Everyone's score for one exam. Used by teachers and by the administrator.
export default async function CbtResults({ exam, scope }) {
  await finalizeExpired({ examId: exam.id });
  const [students, attempts] = await Promise.all([
    prisma.student.findMany({ where: { classId: exam.classId, user: { active: true } }, orderBy: [{ surname: 'asc' }, { firstName: 'asc' }] }),
    prisma.cbtAttempt.findMany({ where: { examId: exam.id } }),
  ]);
  const byStudent = Object.fromEntries(attempts.map((a) => [a.studentId, a]));
  const done = attempts.filter((a) => a.submittedAt && a.totalMarks != null);
  const percents = done.map((a) => pct(a.score, a.totalMarks));
  const avg = percents.length ? Math.round((percents.reduce((x, y) => x + y, 0) / percents.length) * 10) / 10 : null;

  return (
    <>
      <div className="stats">
        <div className="stat"><strong>{students.length}</strong><span>Students in class</span></div>
        <div className="stat"><strong>{attempts.length}</strong><span>Started</span></div>
        <div className="stat"><strong>{done.length}</strong><span>Submitted</span></div>
        <div className="stat"><strong>{avg == null ? '-' : avg + '%'}</strong><span>Average score</span></div>
      </div>
      {students.length === 0 ? (
        <div className="empty"><strong>No students in this class yet</strong></div>
      ) : (
        <div className="table-wrap"><table className="rtable">
          <thead><tr><th>Student</th><th>Admission no</th><th>Status</th><th>Score</th><th>Submitted</th><th></th></tr></thead>
          <tbody>{students.map((s) => {
            const a = byStudent[s.id];
            const status = !a ? ['grey', 'Not started'] : a.submittedAt ? ['green', 'Submitted'] : ['yellow', 'In progress'];
            return (
              <tr key={s.id}>
                <td data-label="Student"><strong>{studentName(s)}</strong></td>
                <td data-label="Admission no">{s.admissionNo}</td>
                <td data-label="Status"><span className={'pill ' + status[0]}>{status[1]}</span></td>
                <td data-label="Score">{a?.submittedAt ? `${a.score} / ${a.totalMarks} (${pct(a.score, a.totalMarks)}%)` : '-'}</td>
                <td data-label="Submitted">{a?.submittedAt ? fmtDateTime(a.submittedAt) : '-'}</td>
                <td>{a && <ActionButton action={resetAttempt.bind(null, scope, exam.id, s.id)} confirm={`Clear ${studentName(s)}'s attempt so they can take the exam again?`}>Allow retake</ActionButton>}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      )}
    </>
  );
}