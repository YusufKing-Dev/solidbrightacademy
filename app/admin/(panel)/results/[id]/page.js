import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getScoreLimits } from '@/lib/academic';
import ActionForm from '@/components/ActionForm';
import ActionButton from '@/components/ActionButton';
import { SubmissionPill } from '@/components/Status';
import { approveSubmission, rejectSubmission, publishSubmission, unpublishSubmission, adminSaveResults } from '@/lib/actions/admin-academic';
import { studentName, TERM_NAMES, fmtDateTime } from '@/lib/utils';

export const metadata = { title: 'Review Results', robots: { index: false, follow: false } };

export default async function ReviewPage({ params }) {
  await requireUser('ADMIN');
  const sub = await prisma.resultSubmission.findUnique({
    where: { id: params.id },
    include: { class: true, subject: true, teacher: true, term: { include: { session: true } }, results: { include: { student: true } } },
  });
  if (!sub) notFound();
  const [limits, history] = await Promise.all([
    getScoreLimits(),
    prisma.auditLog.findMany({ where: { entity: 'submission', entityId: sub.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);
  const rows = [...sub.results].sort((a, b) => a.student.surname.localeCompare(b.student.surname));

  return (
    <>
      <div className="page-title"><h1>{sub.class.name}: {sub.subject.name}</h1><p><Link href="/admin/results">All results</Link>, {sub.term.session.name}, {TERM_NAMES[sub.term.number]}, teacher {sub.teacher.displayName}</p></div>

      <div className="panel">
        <p>Status: <SubmissionPill status={sub.status} published={sub.published} /></p>
        {sub.submittedAt && <p className="muted small">Submitted {fmtDateTime(sub.submittedAt)}{sub.reviewedAt ? `. Reviewed ${fmtDateTime(sub.reviewedAt)}` : ''}</p>}
        {sub.status === 'REJECTED' && <div className="notice err">Rejection reason: {sub.rejectionReason}</div>}

        <div className="row">
          {sub.status === 'PENDING' && (
            <>
              <ActionButton action={approveSubmission.bind(null, sub.id, true)} className="btn btn-primary btn-small" confirm="Approve and publish? Students will see these results immediately.">Approve and publish</ActionButton>
              <ActionButton action={approveSubmission.bind(null, sub.id, false)} className="btn btn-outline btn-small">Approve only</ActionButton>
            </>
          )}
          {sub.status === 'APPROVED' && !sub.published && <ActionButton action={publishSubmission.bind(null, sub.id)} className="btn btn-yellow btn-small" confirm="Publish these results to students?">Publish to students</ActionButton>}
          {sub.published && <ActionButton action={unpublishSubmission.bind(null, sub.id)} className="btn btn-danger btn-small" confirm="Hide these results from students?">Unpublish</ActionButton>}
        </div>

        {sub.status === 'PENDING' && (
          <div style={{ marginTop: 18 }}>
            <h3>Reject with a reason</h3>
            <ActionForm action={rejectSubmission.bind(null, sub.id)} submit="Reject submission" submitClass="btn btn-danger btn-small" confirm="Reject this submission and send it back to the teacher?">
              <label className="field" style={{ marginBottom: 12 }}><span className="lbl req">Reason for the teacher</span><textarea name="reason" required minLength={5} maxLength={500} rows={3} placeholder="What needs to be corrected?" /></label>
            </ActionForm>
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Scores</h2>
        <p className="muted small">CA is out of {limits.maxCA} and exam is out of {limits.maxExam}. You can correct scores here. Every correction is recorded in the history below.</p>
        {rows.length === 0 ? <div className="empty"><strong>No scores saved</strong></div> : (
          <ActionForm action={adminSaveResults.bind(null, sub.id)} submit="Save corrections">
            <div className="table-wrap"><table className="rtable">
              <thead><tr><th>Student</th><th>CA</th><th>Exam</th><th>Total</th><th>Grade</th><th>Teacher’s remark</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Student"><strong>{studentName(r.student)}</strong><br /><span className="muted small">{r.student.admissionNo}</span></td>
                  <td data-label="CA"><input className="num" type="number" name={'ca_' + r.studentId} defaultValue={r.ca ?? ''} min="0" max={limits.maxCA} step="0.5" /></td>
                  <td data-label="Exam"><input className="num" type="number" name={'exam_' + r.studentId} defaultValue={r.exam ?? ''} min="0" max={limits.maxExam} step="0.5" /></td>
                  <td data-label="Total">{r.total ?? '-'}</td>
                  <td data-label="Grade">{r.grade ? <span className="pill blue">{r.grade}</span> : '-'}</td>
                  <td data-label="Teacher’s remark" className="wide"><input name={'rm_' + r.studentId} defaultValue={r.teacherRemark ?? ''} maxLength={120} /></td>
                </tr>
              ))}</tbody>
            </table></div>
          </ActionForm>
        )}
      </div>

      <div className="panel">
        <h2>Submission and approval history</h2>
        {history.length === 0 ? <p className="muted">No history yet.</p> : (
          <ul className="history">{history.map((h) => (<li key={h.id}><strong>{h.action.replace(/_/g, ' ').toLowerCase()}</strong> by {h.actorName}<br /><span className="muted small">{fmtDateTime(h.createdAt)}{h.details ? ' | ' + h.details : ''}</span></li>))}</ul>
        )}
      </div>
    </>
  );
}
