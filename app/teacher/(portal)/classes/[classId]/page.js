import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser, assertTeacherClass } from '@/lib/auth';
import { getCurrent } from '@/lib/academic';
import ActionForm from '@/components/ActionForm';
import { saveClassRemarks } from '@/lib/actions/teacher';
import { studentName, SECTION_LABEL } from '@/lib/utils';

export const metadata = { title: 'Class', robots: { index: false, follow: false } };

export default async function TeacherClass({ params, searchParams }) {
  const user = await requireUser('TEACHER');
  const cls = await assertTeacherClass(user, params.classId);
  if (!cls) notFound(); // not assigned: no access

  const q = String(searchParams?.q || '').trim();
  const { term } = await getCurrent();
  const [mine, students, remarks] = await Promise.all([
    prisma.teacherClass.findMany({ where: { teacherId: user.teacher.id }, include: { class: true }, orderBy: { class: { sortOrder: 'asc' } } }),
    prisma.student.findMany({
      where: {
        classId: cls.id, user: { active: true },
        ...(q ? { OR: [
          { firstName: { contains: q, mode: 'insensitive' } }, { surname: { contains: q, mode: 'insensitive' } },
          { otherNames: { contains: q, mode: 'insensitive' } }, { admissionNo: { contains: q, mode: 'insensitive' } },
        ] } : {}),
      },
      orderBy: [{ surname: 'asc' }, { firstName: 'asc' }],
    }),
    term ? prisma.reportRemark.findMany({ where: { termId: term.id, student: { classId: cls.id } } }) : [],
  ]);
  const remarkOf = Object.fromEntries(remarks.map((r) => [r.studentId, r.classTeacherRemark || '']));

  return (
    <>
      <div className="page-title"><h1>{cls.name}</h1><p>{SECTION_LABEL[cls.section]} section</p></div>
      <div className="tabs">
        {mine.map((m) => (<Link key={m.classId} href={`/teacher/classes/${m.classId}`} className={'btn btn-small ' + (m.classId === cls.id ? 'btn-primary' : 'btn-outline')}>{m.class.name}</Link>))}
      </div>
      <div className="panel">
        <div className="panel-head">
          <h2>Students</h2>
          <Link href="/teacher/results" className="btn btn-primary btn-small">Enter results</Link>
        </div>
        <form method="get" className="toolbar">
          <label className="field"><span className="lbl">Search this class</span><input name="q" defaultValue={q} placeholder="Name or admission number" /></label>
          <button className="btn btn-outline" type="submit">Search</button>
          {q && <Link href={`/teacher/classes/${cls.id}`} className="btn btn-ghost">Clear</Link>}
        </form>
        {students.length === 0 ? (
          <div className="empty"><strong>{q ? 'No student matches your search' : 'No students in this class yet'}</strong>{q ? 'Check the spelling or clear the search.' : 'The administrator adds students to classes.'}</div>
        ) : (
          <div className="table-wrap">
            <table className="rtable">
              <thead><tr><th>Name</th><th>Admission no</th><th>Gender</th></tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td data-label="Name"><strong>{studentName(s)}</strong></td>
                    <td data-label="Admission no">{s.admissionNo}</td>
                    <td data-label="Gender">{s.gender}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {term && students.length > 0 && !q && (
        <div className="panel">
          <h2>Class teacher’s remarks for the current term</h2>
          <p className="muted small">These appear on each student’s result sheet once their results are published.</p>
          <ActionForm action={saveClassRemarks.bind(null, cls.id)} submit="Save remarks" className="form-grid">
            {students.map((s) => (
              <label className="field" key={s.id}>
                <span className="lbl">{studentName(s)}</span>
                <input name={'rem_' + s.id} defaultValue={remarkOf[s.id] || ''} maxLength={300} placeholder="Optional remark" />
              </label>
            ))}
          </ActionForm>
        </div>
      )}
    </>
  );
}