import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { SECTION_LABEL } from '@/lib/utils';

export const metadata = { title: 'My Classes', robots: { index: false, follow: false } };

export default async function MyClasses() {
  const user = await requireUser('TEACHER');
  const links = await prisma.teacherClass.findMany({
    where: { teacherId: user.teacher.id },
    include: { class: { include: { _count: { select: { students: true } } } } },
    orderBy: { class: { sortOrder: 'asc' } },
  });
  return (
    <>
      <div className="page-title"><h1>My classes</h1><p>Only the classes assigned to you by the administrator are shown.</p></div>
      {links.length === 0 ? (
        <div className="panel empty"><strong>No classes assigned yet</strong>Ask the school administrator to assign you to a class.</div>
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
    </>
  );
}
