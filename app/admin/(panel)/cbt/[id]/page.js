import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import CbtResults from '@/components/CbtResults';
import ActionButton from '@/components/ActionButton';
import { setExamPublished, deleteExam } from '@/lib/actions/cbt';
import { fmtDateTime } from '@/lib/utils';

export const metadata = { title: 'CBT Exam', robots: { index: false, follow: false } };

export default async function AdminExam({ params }) {
  await requireUser('ADMIN');
  const exam = await prisma.cbtExam.findUnique({ where: { id: params.id }, include: { class: true, subject: true, teacher: true, _count: { select: { questions: true } } } });
  if (!exam) notFound();
  return (
    <>
      <div className="page-title"><h1>{exam.title}</h1><p><Link href="/admin/cbt">All exams</Link>, {exam.class.name}: {exam.subject.name}, teacher {exam.teacher?.displayName || '-'}</p></div>
      <div className="panel">
        <dl className="dl">
          <div><dt>Status</dt><dd>{exam.published ? <span className="pill green">Published</span> : <span className="pill grey">Draft</span>}</dd></div>
          <div><dt>Questions</dt><dd>{exam._count.questions}</dd></div>
          <div><dt>Time allowed</dt><dd>{exam.durationMinutes} minutes</dd></div>
          <div><dt>Opens</dt><dd>{exam.startsAt ? fmtDateTime(exam.startsAt) : 'When published'}</dd></div>
          <div><dt>Closes</dt><dd>{exam.endsAt ? fmtDateTime(exam.endsAt) : 'No closing time'}</dd></div>
        </dl>
        <div className="row" style={{ marginTop: 14 }}>
          <ActionButton action={setExamPublished.bind(null, 'admin', exam.id, !exam.published)} className="btn btn-small btn-outline">{exam.published ? 'Unpublish' : 'Publish'}</ActionButton>
          <ActionButton action={deleteExam.bind(null, 'admin', exam.id)} className="btn btn-small btn-danger" confirm="Delete this exam and all student attempts? This cannot be undone.">Delete exam</ActionButton>
        </div>
      </div>
      <div className="panel"><h2>Results</h2><CbtResults exam={exam} scope="admin" /></div>
    </>
  );
}