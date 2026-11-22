import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getCurrent } from '@/lib/academic';
import ActionForm from '@/components/ActionForm';
import ActionButton from '@/components/ActionButton';
import { saveClass, deleteClass, setClassTeachers, setClassSubjects, addStudentsToClass } from '@/lib/actions/admin-people';
import { savePrincipalRemarks } from '@/lib/actions/admin-academic';
import { SECTION_LABEL, studentName } from '@/lib/utils';

export const metadata = { title: 'Class', robots: { index: false, follow: false } };

export default async function ClassPage({ params }) {
  await requireUser('ADMIN');
  const c = await prisma.schoolClass.findUnique({
    where: { id: params.id },
    include: { assignments: true, classSubjects: true, students: { include: { user: { select: { active: true } } }, orderBy: [{ surname: 'asc' }, { firstName: 'asc' }] } },
  });
  if (!c) notFound();
  const [teachers, subjects] = await Promise.all([
    prisma.teacher.findMany({ where: { user: { active: true } }, orderBy: { displayName: 'asc' } }),
    prisma.subject.findMany({ orderBy: { name: 'asc' } }),
  ]);
  const { term, session, termName } = await getCurrent();
  const remarks = term ? await prisma.reportRemark.findMany({ where: { termId: term.id, student: { classId: c.id } } }) : [];
  const remarkOf = Object.fromEntries(remarks.map((r) => [r.studentId, r.principalRemark || '']));
  const tSet = new Set(c.assignments.map((a) => a.teacherId));
  const sSet = new Set(c.classSubjects.map((a) => a.subjectId));

  return (
    <>
      <div className="page-title"><h1>{c.name}</h1><p><Link href="/admin/classes">All classes</Link>, {SECTION_LABEL[c.section]} section</p></div>

      <div className="panel"><h2>Class details</h2>
        <ActionForm action={saveClass.bind(null, c.id)} className="form-grid two">
          <label className="field"><span className="lbl req">Class name</span><input name="name" required defaultValue={c.name} maxLength={40} /></label>
          <label className="field"><span className="lbl req">School section</span>
            <select name="section" defaultValue={c.section}>{Object.entries(SECTION_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select>
          </label>
          <label className="field"><span className="lbl">Order in lists</span><input name="sortOrder" type="number" defaultValue={c.sortOrder} /></label>
        </ActionForm>
      </div>

      <div className="panel"><h2>Teachers for this class</h2>
        {teachers.length === 0 ? <div className="empty"><strong>No active teachers yet</strong><Link href="/admin/teachers/new">Add a teacher</Link> first.</div> : (
          <ActionForm action={setClassTeachers.bind(null, c.id)} submit="Save teachers">
            <div className="checks" style={{ marginBottom: 14 }}>
              {teachers.map((t) => (<label className="check" key={t.id}><input type="checkbox" name="teacherIds" value={t.id} defaultChecked={tSet.has(t.id)} /> {t.displayName}</label>))}
            </div>
          </ActionForm>
        )}
      </div>

      <div className="panel"><h2>Subjects for this class</h2>
        <p className="muted small">Teachers can enter results only for the subjects ticked here. Manage the full list on the <Link href="/admin/subjects">Subjects</Link> page.</p>
        {subjects.length === 0 ? <div className="empty"><strong>No subjects yet</strong></div> : (
          <ActionForm action={setClassSubjects.bind(null, c.id)} submit="Save subjects">
            <div className="checks" style={{ marginBottom: 14 }}>
              {subjects.map((s) => (<label className="check" key={s.id}><input type="checkbox" name="subjectIds" value={s.id} defaultChecked={sSet.has(s.id)} /> {s.name}</label>))}
            </div>
          </ActionForm>
        )}
      </div>

      <div className="panel"><h2>Students ({c.students.length})</h2>
        {c.students.length === 0 ? <div className="empty"><strong>No students in this class yet</strong>Register a student or move students in below.</div> : (
          <div className="table-wrap"><table className="rtable">
            <thead><tr><th>Name</th><th>Admission no</th><th>Portal</th><th></th></tr></thead>
            <tbody>{c.students.map((s) => (
              <tr key={s.id}><td data-label="Name"><strong>{studentName(s)}</strong>{!s.user.active && <span className="pill grey" style={{ marginLeft: 8 }}>Inactive</span>}</td><td data-label="Admission no">{s.admissionNo}</td><td data-label="Portal">{s.portalEnabled ? <span className="pill green">ON</span> : <span className="pill red">OFF</span>}</td><td><Link className="btn btn-small btn-outline" href={`/admin/students/${s.id}`}>Open</Link></td></tr>
            ))}</tbody>
          </table></div>
        )}
        <h3 style={{ marginTop: 22 }}>Move students into this class</h3>
        <ActionForm action={addStudentsToClass.bind(null, c.id)} submit="Move students" resetOnSuccess>
          <label className="field" style={{ marginBottom: 12 }}><span className="lbl">Admission numbers</span><textarea name="admissionNos" rows={2} placeholder="SBA/2026/001, SBA/2026/002" /><span className="help">Separate with commas or new lines.</span></label>
        </ActionForm>
      </div>

      {term && c.students.length > 0 && (
        <div className="panel"><h2>Principal’s remarks</h2>
          <p className="muted small">For {session.name}, {termName}. Shown on each student’s result sheet.</p>
          <ActionForm action={savePrincipalRemarks.bind(null, c.id)} submit="Save remarks" className="form-grid">
            {c.students.map((s) => (<label className="field" key={s.id}><span className="lbl">{studentName(s)}</span><input name={'rem_' + s.id} defaultValue={remarkOf[s.id] || ''} maxLength={300} placeholder="Optional remark" /></label>))}
          </ActionForm>
        </div>
      )}

      <div className="panel"><h2>Delete class</h2>
        <p className="muted small">A class can be deleted only when it has no students and no result records.</p>
        <ActionButton action={deleteClass.bind(null, c.id)} className="btn btn-small btn-danger" confirm={`Delete ${c.name}?`}>Delete class</ActionButton>
      </div>
    </>
  );
}
