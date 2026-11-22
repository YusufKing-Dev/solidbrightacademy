import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import ActionButton from '@/components/ActionButton';
import { setExamPublished } from '@/lib/actions/cbt';

export const metadata = { title: 'CBT Exams', robots: { index: false, follow: false } };

export default async function AdminCbt({ searchParams }) {
  await requireUser('ADMIN');
  const classId = String(searchParams?.classId || '');
  const status = String(searchParams?.status || '');
  const [classes, exams] = await Promise.all([
    prisma.schoolClass.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.cbtExam.findMany({
      where: { ...(classId ? { classId } : {}), ...(status === 'published' ? { published: true } : status === 'draft' ? { published: false } : {}) },
      include: { class: true, subject: true, teacher: true, _count: { select: { questions: true, attempts: true } } },
      orderBy: { createdAt: 'desc' }, take: 300,
    }),
  ]);
  return (
    <>
      <div className="page-title"><h1>CBT exams</h1><p>Exams created by teachers. You can publish, unpublish, view results and delete.</p></div>
      <div className="panel">
        <form method="get" className="toolbar">
          <label className="field"><span className="lbl">Class</span><select name="classId" defaultValue={classId}><option value="">All classes</option>{classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></label>
          <label className="field"><span className="lbl">Status</span><select name="status" defaultValue={status}><option value="">All</option><option value="published">Published</option><option value="draft">Draft</option></select></label>
          <button className="btn btn-outline" type="submit">Filter</button>
          <Link href="/admin/cbt" className="btn btn-ghost">Clear</Link>
        </form>
        {exams.length === 0 ? <div className="empty"><strong>No exams found</strong>Teachers create CBT exams from their portal.</div> : (
          <div className="table-wrap"><table className="rtable">
            <thead><tr><th>Exam</th><th>Class and subject</th><th>Teacher</th><th>Questions</th><th>Taken</th><th>Status</th><th></th></tr></thead>
            <tbody>{exams.map((e) => (
              <tr key={e.id}>
                <td data-label="Exam"><strong>{e.title}</strong></td>
                <td data-label="Class and subject">{e.class.name}: {e.subject.name}</td>
                <td data-label="Teacher">{e.teacher?.displayName || '-'}</td>
                <td data-label="Questions">{e._count.questions}</td>
                <td data-label="Taken">{e._count.attempts}</td>
                <td data-label="Status">{e.published ? <span className="pill green">Published</span> : <span className="pill grey">Draft</span>}</td>
                <td className="wide"><div className="row"><Link className="btn btn-small btn-outline" href={`/admin/cbt/${e.id}`}>Open</Link>
                  <ActionButton action={setExamPublished.bind(null, 'admin', e.id, !e.published)}>{e.published ? 'Unpublish' : 'Publish'}</ActionButton></div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}