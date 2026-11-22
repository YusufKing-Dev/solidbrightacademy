import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import ActionForm from '@/components/ActionForm';
import ImageField from '@/components/ImageField';
import { saveAnnouncement } from '@/lib/actions/admin-site';
import { toInputDate } from '@/lib/utils';

export const metadata = { title: 'Announcement', robots: { index: false, follow: false } };

export default async function AnnouncementEditor({ params }) {
  await requireUser('ADMIN');
  const isNew = params.id === 'new';
  const a = isNew ? null : await prisma.announcement.findUnique({ where: { id: params.id } });
  if (!isNew && !a) notFound();
  return (
    <>
      <div className="page-title"><h1>{isNew ? 'New announcement' : 'Edit announcement'}</h1><p><Link href="/admin/announcements">All announcements</Link></p></div>
      <div className="panel">
        <ActionForm action={saveAnnouncement.bind(null, params.id)} submit={isNew ? 'Save announcement' : 'Save changes'} className="form-grid two">
          <label className="field span2"><span className="lbl req">Title</span><input name="title" required defaultValue={a?.title || ''} maxLength={150} /></label>
          <label className="field"><span className="lbl">Category (optional)</span><input name="category" defaultValue={a?.category || ''} maxLength={40} placeholder="e.g. Events" /></label>
          <label className="field"><span className="lbl">Publication date</span><input name="publishedAt" type="date" defaultValue={toInputDate(a?.publishedAt)} /><span className="help">Leave empty to use today when you publish.</span></label>
          <label className="field span2"><span className="lbl req">Content</span><textarea name="content" required rows={8} defaultValue={a?.content || ''} maxLength={8000} /></label>
          <div className="span2"><ImageField name="imageUrl" label="Featured image (optional)" folder="announcements" defaultValue={a?.imageUrl || ''} /></div>
          <label className="check span2"><input type="checkbox" name="published" defaultChecked={a?.published || false} /> Publish now (visible on the website and to students)</label>
        </ActionForm>
      </div>
    </>
  );
}
