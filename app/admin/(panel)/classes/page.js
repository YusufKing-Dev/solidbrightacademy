import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import ActionForm from '@/components/ActionForm';
import { saveClass } from '@/lib/actions/admin-people';
import { SECTION_LABEL } from '@/lib/utils';

export const metadata = { title: 'Classes', robots: { index: false, follow: false } };

export default async function Classes() {
  await requireUser('ADMIN');
  const classes = await prisma.schoolClass.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { assignments: { include: { teacher: true } }, _count: { select: { students: true, classSubjects: true } } },
  });
  return (
    <>
      <div className="page-title"><h1>Classes</h1><p>Primary and secondary structure of the school.</p></div>
      {['PRE_BASIC', 'BASIC', 'COLLEGE'].map((sec) => (
        <div className="panel" key={sec}>
          <h2>{SECTION_LABEL[sec]}</h2>
          <div className="table-wrap"><table className="rtable">
            <thead><tr><th>Class</th><th>Teachers</th><th>Students</th><th>Subjects</th><th></th></tr></thead>
            <tbody>
              {classes.filter((c) => c.section === sec).map((c) => (
                <tr key={c.id}>
                  <td data-label="Class"><strong>{c.name}</strong></td>
                  <td data-label="Teachers">{c.assignments.length ? c.assignments.map((a) => a.teacher.displayName).join(', ') : <span className="muted">Unassigned</span>}</td>
                  <td data-label="Students">{c._count.students}</td>
                  <td data-label="Subjects">{c._count.classSubjects}</td>
                  <td><Link className="btn btn-small btn-outline" href={`/admin/classes/${c.id}`}>Manage</Link></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      ))}
      <div className="panel">
        <h2>Add a class</h2>
        <ActionForm action={saveClass.bind(null, 'new')} submit="Add class" className="form-grid two">
          <label className="field"><span className="lbl req">Class name</span><input name="name" required maxLength={40} placeholder="e.g. Basic 6" /></label>
          <label className="field"><span className="lbl req">School section</span>
            <select name="section" required defaultValue="BASIC">{Object.entries(SECTION_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select>
          </label>
          <label className="field"><span className="lbl">Order in lists</span><input name="sortOrder" type="number" defaultValue={100} /><span className="help">Smaller numbers come first.</span></label>
        </ActionForm>
      </div>
    </>
  );
}
