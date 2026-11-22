import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import ActionForm from '@/components/ActionForm';
import ActionButton from '@/components/ActionButton';
import { createSubject, renameSubject, deleteSubject } from '@/lib/actions/admin-academic';

export const metadata = { title: 'Subjects', robots: { index: false, follow: false } };

export default async function Subjects() {
  await requireUser('ADMIN');
  const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { classSubjects: true } } } });
  return (
    <>
      <div className="page-title"><h1>Subjects</h1><p>Add subjects here, then switch them on for each class on the class page.</p></div>
      <div className="panel"><h2>Add a subject</h2>
        <ActionForm action={createSubject} submit="Add subject" className="toolbar" resetOnSuccess>
          <label className="field"><span className="lbl">Subject name</span><input name="name" required maxLength={80} /></label>
        </ActionForm>
      </div>
      <div className="panel"><h2>{subjects.length} subjects</h2>
        {subjects.length === 0 ? <div className="empty"><strong>No subjects yet</strong></div> : (
          <div className="table-wrap"><table className="rtable">
            <thead><tr><th>Subject</th><th>Used in</th><th>Rename</th><th></th></tr></thead>
            <tbody>{subjects.map((s) => (
              <tr key={s.id}>
                <td data-label="Subject"><strong>{s.name}</strong></td>
                <td data-label="Used in">{s._count.classSubjects} class{s._count.classSubjects === 1 ? '' : 'es'}</td>
                <td data-label="Rename" className="wide"><ActionForm action={renameSubject.bind(null, s.id)} submit="Rename" submitClass="btn btn-small btn-outline" className="row"><input name="name" defaultValue={s.name} maxLength={80} aria-label={`New name for ${s.name}`} /></ActionForm></td>
                <td><ActionButton action={deleteSubject.bind(null, s.id)} className="btn btn-small btn-danger" confirm={`Delete ${s.name}?`}>Delete</ActionButton></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
