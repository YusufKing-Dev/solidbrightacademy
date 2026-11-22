import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import ActionForm from '@/components/ActionForm';
import ActionButton from '@/components/ActionButton';
import { AppPill } from '@/components/Status';
import { setApplicationStatus, saveApplicationNote, deleteApplication } from '@/lib/actions/admin-site';
import { fmtDate, fmtDateTime } from '@/lib/utils';

export const metadata = { title: 'Application', robots: { index: false, follow: false } };

export default async function ApplicationPage({ params }) {
  await requireUser('ADMIN');
  const a = await prisma.application.findUnique({ where: { id: params.id } });
  if (!a) notFound();
  return (
    <>
      <div className="page-title"><h1>{a.applicantName}</h1><p><Link href="/admin/applications">All applications</Link></p></div>
      <div className="panel">
        <p>Status: <AppPill status={a.status} /></p>
        <div className="row">
          {[['PENDING', 'Mark pending'], ['REVIEWED', 'Mark reviewed'], ['ACCEPTED', 'Accept'], ['REJECTED', 'Reject'], ['ARCHIVED', 'Archive']].filter(([s]) => s !== a.status).map(([s, label]) => (
            <ActionButton key={s} action={setApplicationStatus.bind(null, a.id, s)} className={'btn btn-small ' + (s === 'ACCEPTED' ? 'btn-primary' : s === 'REJECTED' ? 'btn-danger' : 'btn-outline')} confirm={s === 'REJECTED' ? 'Reject this application?' : undefined}>{label}</ActionButton>
          ))}
        </div>
      </div>
      <div className="panel">
        <h2>Applicant</h2>
        <dl className="dl">
          <div><dt>Full name</dt><dd>{a.applicantName}</dd></div><div><dt>Date of birth</dt><dd>{fmtDate(a.dob)}</dd></div><div><dt>Gender</dt><dd>{a.gender}</dd></div>
          <div><dt>Class applying for</dt><dd>{a.classApplying}</dd></div><div><dt>Previous school</dt><dd>{a.previousSchool || '-'}</dd></div><div><dt>Additional information</dt><dd>{a.notes || '-'}</dd></div>
        </dl>
        <h2 style={{ marginTop: 22 }}>Parent or guardian</h2>
        <dl className="dl">
          <div><dt>Name</dt><dd>{a.guardianName}</dd></div><div><dt>Phone</dt><dd><a href={`tel:${a.guardianPhone}`}>{a.guardianPhone}</a></dd></div>
          <div><dt>Email</dt><dd><a href={`mailto:${a.guardianEmail}`}>{a.guardianEmail}</a></dd></div><div><dt>Address</dt><dd>{a.address}</dd></div>
          <div><dt>Received</dt><dd>{fmtDateTime(a.createdAt)}</dd></div>
        </dl>
      </div>
      <div className="panel"><h2>Office note</h2>
        <ActionForm action={saveApplicationNote.bind(null, a.id)} submit="Save note"><label className="field" style={{ marginBottom: 12 }}><span className="lbl">Private note (not shown to the parent)</span><textarea name="adminNote" rows={3} defaultValue={a.adminNote || ''} maxLength={1000} /></label></ActionForm>
      </div>
      <div className="panel"><ActionButton action={deleteApplication.bind(null, a.id)} className="btn btn-small btn-danger" confirm="Delete this application permanently?">Delete application</ActionButton></div>
    </>
  );
}