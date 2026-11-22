import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getCurrent } from '@/lib/academic';
import { fmtDate, SECTION_LABEL } from '@/lib/utils';

export const metadata = { title: 'Teacher Dashboard', robots: { index: false, follow: false } };

export default async function TeacherHome() {
  const user = await requireUser('TEACHER');
  const t = user.teacher;
  const { session, term, termName } = await getCurrent();
  const links = await prisma.teacherClass.findMany({
    where: { teacherId: t.id },
    include: { class: { include: { _count: { select: { students: true } } } } },
    orderBy: { class: { sortOrder: 'asc' } },
  });
  const classIds = links.map((l) => l.classId);
  const [subs, news] = await Promise.all([
    term && classIds.length ? prisma.resultSubmission.findMany({ where: { termId: term.id, classId: { in: classIds } }, select: { status: true } }) : [],
    prisma.announcement.findMany({ where: { published: true, publishedAt: { lte: new Date() } }, orderBy: { publishedAt: 'desc' }, take: 3 }),
  ]);
  const count = (s) => subs.filter((x) => x.status === s).length;

  return (
    <>
      <div className="page-title">
        <h1>Welcome, {t.displayName}</h1>
        <p>{session ? `Academic session ${session.name}, ${termName}` : 'The administrator has not set the current session yet.'}</p>
      </div>
      <div className="stats">
        <div className="stat"><strong>{links.length}</strong><span>Assigned classes</span></div>
        <div className="stat"><strong>{count('DRAFT') + count('REJECTED')}</strong><span>Drafts and rejected</span></div>
        <div className="stat"><strong>{count('PENDING')}</strong><span>Pending approval</span></div>
        <div className="stat"><strong>{count('APPROVED')}</strong><span>Approved</span></div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>My classes</h2><Link href="/teacher/results" className="btn btn-primary btn-small">Enter results</Link></div>
        {links.length === 0 ? (
          <div className="empty"><strong>No classes assigned yet</strong>Ask the school administrator to assign you to a class.</div>
        ) : (
          <div className="grid g3">
            {links.map((l) => (
              <Link key={l.id} href={`/teacher/classes/${l.classId}`} className="card news-card">
                <h3>{l.class.name}</h3>
                <p className="muted" style={{ margin: 0 }}>{SECTION_LABEL[l.class.section]} section<br />{l.class._count.students} student{l.class._count.students === 1 ? '' : 's'}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Announcements</h2>
        {news.length === 0 ? <div className="empty"><strong>Nothing new</strong>School announcements will show here.</div> : (
          <ul className="history">
            {news.map((a) => (<li key={a.id}><strong>{a.title}</strong><br /><span className="muted small">{fmtDate(a.publishedAt)}</span><br />{a.content.length > 200 ? a.content.slice(0, 200).trim() + '…' : a.content}</li>))}
          </ul>
        )}
      </div>
    </>
  );
}
