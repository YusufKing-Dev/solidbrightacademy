import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import StudentForm from '@/components/StudentForm';
import ActionForm from '@/components/ActionForm';
import ActionButton from '@/components/ActionButton';
import PortalToggle from '@/components/PortalToggle';
import { updateStudent, setPortalAccess, resetStudentPassword, setStudentActive, deleteStudent } from '@/lib/actions/admin-people';
import { studentName, SECTION_LABEL, fmtDate, fmtDateTime } from '@/lib/utils';

export const metadata = { title: 'Student', robots: { index: false, follow: false } };

export default async function StudentPage({ params, searchParams }) {
  await requireUser('ADMIN');
  const st = await prisma.student.findUnique({ where: { id: params.id }, include: { class: true, user: true, _count: { select: { results: true } } } });
  if (!st) notFound();
  const classes = await prisma.schoolClass.findMany({ orderBy: { sortOrder: 'asc' } });
  const name = studentName(st);

  return (
    <>
      <div className="page-title"><h1>{name}</h1><p><Link href="/admin/students">All students</Link></p></div>

      {searchParams?.created === '1' && (
        <div className="creds" role="status">
          <strong>Student registered.</strong> Give these login details to the student or parent:<br />
          Username (admission number): <code>{st.admissionNo}</code><br />
          First password: <code>{st.surname}</code> (or the first password you set). The student will choose a new password at first login.
        </div>
      )}

      <div className="panel">
        <div className="profile-head">
          {st.photoUrl ? <img src={st.photoUrl} alt={`Photo of ${name}`} className="avatar" /> : <div className="avatar ph" aria-hidden="true">{st.firstName[0]}{st.surname[0]}</div>}
          <div>
            <div className="row"><span className="pill blue">{st.class.name}</span><span className="pill grey">{SECTION_LABEL[st.class.section]}</span>{!st.user.active && <span className="pill red">Deactivated</span>}</div>
            <p className="muted small" style={{ margin: '8px 0 0' }}>Admission number {st.admissionNo}. Last login: {st.user.lastLoginAt ? fmtDateTime(st.user.lastLoginAt) : 'never'}.</p>
          </div>
        </div>
        <dl className="dl" style={{ marginTop: 18 }}>
          <div><dt>Gender</dt><dd>{st.gender}</dd></div>
          <div><dt>Date of birth</dt><dd>{st.dob ? fmtDate(st.dob) : '-'}</dd></div>
          <div><dt>Parent or guardian</dt><dd>{st.guardianName}, {st.guardianPhone}{st.guardianEmail ? ', ' + st.guardianEmail : ''}</dd></div>
          <div><dt>Address</dt><dd>{st.address || '-'}</dd></div>
          <div><dt>Portal access</dt><dd><PortalToggle action={setPortalAccess.bind(null, st.id)} enabled={st.portalEnabled} name={name} /></dd></div>
        </dl>
      </div>

      <div className="panel">
        <h2>Login and account</h2>
        <ActionForm action={resetStudentPassword.bind(null, st.id)} submit="Reset password" submitClass="btn btn-outline btn-small" className="toolbar" confirm="Reset this student's password?">
          <label className="field"><span className="lbl">New password</span><input name="password" placeholder={`Leave empty to use the surname (${st.surname})`} maxLength={60} /></label>
        </ActionForm>
        <div className="row">
          {st.user.active
            ? <ActionButton action={setStudentActive.bind(null, st.id, false)} confirm={`Deactivate ${name}? They will not be able to log in.`}>Deactivate student</ActionButton>
            : <ActionButton action={setStudentActive.bind(null, st.id, true)}>Reactivate student</ActionButton>}
          <ActionButton action={deleteStudent.bind(null, st.id)} className="btn btn-small btn-danger" confirm={`Delete ${name} permanently? This cannot be undone.`}>Delete student</ActionButton>
        </div>
        {st._count.results > 0 && <p className="muted small" style={{ marginTop: 10 }}>This student has saved results, so they can be deactivated but not deleted.</p>}
      </div>

      <div className="panel">
        <h2>Edit details</h2>
        <StudentForm action={updateStudent.bind(null, st.id)} student={st} classes={classes} />
      </div>
    </>
  );
}
