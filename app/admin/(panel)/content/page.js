import { requireUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { CONTENT_FIELDS } from '@/lib/defaults';
import FieldsForm from '@/components/FieldsForm';
import { saveFields } from '@/lib/actions/admin-site';

export const metadata = { title: 'Website Content', robots: { index: false, follow: false } };

export default async function Content() {
  await requireUser('ADMIN');
  const s = await getSettings();
  return (
    <>
      <div className="page-title"><h1>Website content</h1><p>Change the words and pictures on the public website. Changes appear as soon as you save.</p></div>
      <div className="panel"><FieldsForm action={saveFields.bind(null, 'content')} fields={CONTENT_FIELDS.filter((f) => f.group === 'content')} values={s} /></div>
    </>
  );
}
