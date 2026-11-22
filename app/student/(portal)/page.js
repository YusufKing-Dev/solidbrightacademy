import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getCurrent } from '@/lib/academic';
import { SECTION_LABEL, studentName, fmtDate } from '@/lib/utils';

export const metadata = { title: 'Student Dashboard', robots: { index: false, follow: false } };

export default async function StudentHome() {
  const user = await requireUser('STUDENT');
  const st = user.student;
  const { session, term, termName } = await getCurrent();
  const [news, available] = await Promise.all([
    prisma.announcement.findMany({ where: { published: true, publishedAt: { lte: new Date() } }, orderBy: { publishedAt: 'desc' }, take: 5 }),
    term
      ? prisma.result.count({ where: { studentId: st.id, total: { not: null }, submission: { termId: term.id, published: true, status: 'APPROVED' } } })
      : 0,
  ]);
  const name = studentName(st);

  return (
    <>
      <div className="panel">
        <div className="profile-head">
          {st.photoUrl ? <img src={st.photoUrl} alt={`Photo of ${name}`} className="avatar" /> : <div className="avatar ph" aria-hidden="true">{st.firstName[0]}{st.surname[0]}</div>}
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Welcome, {st.firstName}</h1>
            <p className="muted" style={{ margin: 0 }}>{name}</p>
          </div>
        </div>
        <dl className="dl" style={{ marginTop: 18 }}>
          <div><dt>Admission number</dt><dd>{st.admissionNo}</dd></div>
          <div><dt>Class</dt><dd>{st.class.name}</dd></div>
          <div><dt>School section</dt><dd>{SECTION_LABEL[st.class.section]}</dd></div>
          <div><dt>Academic session</dt><dd>{session ? session.name : 'Not set yet'}</dd></div>
          <div><dt>Current term</dt><dd>{termName || 'Not set yet'}</dd></div>
          <div><dt>Portal access</dt><dd><span className="pill green">Active</span></dd></div>
        </dl>
      </div>

      <div className="panel">
        <h2>My results</h2>
        <p>{available > 0 ? `${available} subject result${available > 1 ? 's are' : ' is'} available for ${session?.name}, ${termName}.` : `Results for ${session ? session.name + ', ' + termName : 'this term'} are not available yet. They appear here after the school approves and publishes them.`}</p>
        <Link href="/student/results" className="btn btn-primary">Check my results</Link>
      </div>

      <div className="panel">
        <h2>Announcements</h2>
        {news.length === 0 ? (
          <div className="empty"><strong>Nothing new</strong>School announcements will show here.</div>
        ) : (
          <ul className="history">
            {news.map((a) => (
              <li key={a.id}><strong>{a.title}</strong><br /><span className="muted small">{fmtDate(a.publishedAt)}</span><br />{a.content.length > 220 ? a.content.slice(0, 220).trim() + '…' : a.content}</li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
