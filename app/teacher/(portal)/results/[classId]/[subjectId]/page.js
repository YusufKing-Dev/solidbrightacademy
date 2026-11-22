import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser, assertTeacherClass } from '@/lib/auth';
import { getCurrent, getScoreLimits } from '@/lib/academic';
import ActionForm from '@/components/ActionForm';
import { SubmissionPill } from '@/components/Status';
import { saveResults } from '@/lib/actions/teacher';
import { studentName, fmtDateTime } from '@/lib/utils';

export const metadata = { title: 'Result Entry', robots: { index: false, follow: false } };

export default async function EntryPage({ params }) {
  const user = await requireUser('TEACHER');
  const cls = await assertTeacherClass(user, params.classId);
  if (!cls) notFound(); // unassigned classes are never accessible

  const cs = await prisma.classSubject.findUnique({
    where: { classId_subjectId: { classId: cls.id, subjectId: params.subjectId } },
    include: { subject: true },
  });
  if (!cs) notFound();

  const { session, term, termName } = await getCurrent();
  const limits = await getScoreLimits();
  const [students, sub] = await Promise.all([
    prisma.student.findMany({ where: { classId: cls.id, user: { active: true } }, orderBy: [{ surname: 'asc' }, { firstName: 'asc' }] }),
    term ? prisma.resultSubmission.findUnique({
      where: { classId_subjectId_termId: { classId: cls.id, subjectId: cs.subjectId, termId: term.id } },
      include: { results: true },
    }) : null,
  ]);
  const rowOf = Object.fromEntries((sub?.results || []).map((r) => [r.studentId, r]));
  const locked = sub && (sub.status === 'PENDING' || sub.status === 'APPROVED');

  return (
    <>
      <div className="page-title">
        <h1>{cls.name}: {cs.subject.name}</h1>
        <p>{term ? `${session.name}, ${termName}` : 'No current term set'}</p>
      </div>
      <p><Link href="/teacher/results" className="btn btn-ghost btn-small">Back to subjects</Link></p>

      {!term && <div className="notice warn">The administrator has not set the current term yet, so results cannot be entered.</div>}
      {sub && <p>Status: <SubmissionPill status={sub.status} published={sub.published} />{sub.submittedAt && <span className="muted small"> Submitted {fmtDateTime(sub.submittedAt)}</span>}</p>}
      {sub?.status === 'REJECTED' && (
        <div className="notice err" role="alert">The administrator rejected this submission. Reason: {sub.rejectionReason}. Please correct the scores and submit again.</div>
      )}
      {sub?.status === 'PENDING' && <div className="notice warn">Waiting for the administrator to review. You cannot change these results while they are pending.</div>}
      {sub?.status === 'APPROVED' && <div className="notice ok">Approved by the administrator. These results are now locked.</div>}

      {term && students.length === 0 && <div className="panel empty"><strong>No students in this class yet</strong>The administrator adds students to classes.</div>}

      {term && students.length > 0 && (
        <div className="panel">
          <p className="muted small">Continuous assessment is out of {limits.maxCA} and the exam is out of {limits.maxExam}. Totals and grades are worked out automatically using the school’s grading system. Leave both boxes empty for a student who did not take this subject.</p>
          <ActionForm action={saveResults.bind(null, cls.id, cs.subjectId)} showSubmit={false}>
            <div className="table-wrap">
              <table className="rtable">
                <thead><tr><th>Student</th><th>CA ({limits.maxCA})</th><th>Exam ({limits.maxExam})</th><th>Total</th><th>Grade</th><th>Remark</th></tr></thead>
                <tbody>
                  {students.map((s) => {
                    const r = rowOf[s.id] || {};
                    return (
                      <tr key={s.id}>
                        <td data-label="Student"><strong>{studentName(s)}</strong><br /><span className="muted small">{s.admissionNo}</span></td>
                        <td data-label="CA"><input className="num" type="number" name={'ca_' + s.id} defaultValue={r.ca ?? ''} min="0" max={limits.maxCA} step="0.5" inputMode="decimal" disabled={locked} /></td>
                        <td data-label="Exam"><input className="num" type="number" name={'exam_' + s.id} defaultValue={r.exam ?? ''} min="0" max={limits.maxExam} step="0.5" inputMode="decimal" disabled={locked} /></td>
                        <td data-label="Total">{r.total ?? '-'}</td>
                        <td data-label="Grade">{r.grade ? <span className="pill blue">{r.grade}</span> : '-'}</td>
                        <td data-label="Remark" className="wide"><input name={'rm_' + s.id} defaultValue={r.teacherRemark ?? ''} maxLength={120} placeholder={r.remark || 'Optional remark'} disabled={locked} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!locked && (
              <div className="row" style={{ marginTop: 16 }}>
                <button type="submit" name="intent" value="draft" className="btn btn-outline">Save draft</button>
                <button type="submit" name="intent" value="submit" className="btn btn-primary" data-confirm="Submit these results for approval? You will not be able to change them while they are pending.">Submit for approval</button>
              </div>
            )}
          </ActionForm>
        </div>
      )}
    </>
  );
}
