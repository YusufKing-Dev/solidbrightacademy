import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { SECTION_LABEL } from '@/lib/utils';
import ActionForm from '@/components/ActionForm';
import HoneyFields from '@/components/HoneyFields';
import { submitApplication } from '@/lib/actions/public';

export const metadata = {
  title: 'Admissions | Apply to Solid Bright Academy, Ilorin',
  description:
    'Apply online for admission to Solid Bright Academy, a nursery, primary and secondary school in Upper Gaa Akanbi, Ilorin, Kwara State. Pre-Basic, Basic and College.',
  alternates: { canonical: '/admissions' },
};

export default async function Admissions() {
  const s = await getSettings();
  const classes = await prisma.schoolClass.findMany({ orderBy: { sortOrder: 'asc' } }).catch(() => []);
  const sections = ['PRE_BASIC', 'BASIC', 'COLLEGE'];

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>Admissions</h1>
          <p className="lead">{s.admissionInfo}</p>
        </div>
      </div>
      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          <h2>Online application form</h2>
          <p className="muted">Fields marked with * are required.</p>
          <ActionForm action={submitApplication} submit="Submit application" replaceOnSuccess className="form-grid two">
            <HoneyFields />
            <label className="field span2"><span className="lbl req">Applicant’s full name</span><input name="applicantName" required minLength={3} maxLength={120} autoComplete="off" /></label>
            <label className="field"><span className="lbl req">Date of birth</span><input name="dob" type="date" required /></label>
            <label className="field"><span className="lbl req">Gender</span>
              <select name="gender" required defaultValue=""><option value="" disabled>Select</option><option>Male</option><option>Female</option></select>
            </label>
            <label className="field span2"><span className="lbl req">Parent or guardian’s full name</span><input name="guardianName" required minLength={3} maxLength={120} autoComplete="name" /></label>
            <label className="field"><span className="lbl req">Parent or guardian’s phone number</span><input name="guardianPhone" type="tel" required inputMode="tel" autoComplete="tel" /></label>
            <label className="field"><span className="lbl req">Parent or guardian’s email</span><input name="guardianEmail" type="email" required autoComplete="email" /></label>
            <label className="field span2"><span className="lbl req">Residential address</span><textarea name="address" required minLength={5} maxLength={300} rows={3} autoComplete="street-address" /></label>
            <label className="field"><span className="lbl req">Class applying for</span>
              <select name="classApplying" required defaultValue="">
                <option value="" disabled>Select a class</option>
                {sections.map((sec) => (
                  <optgroup key={sec} label={SECTION_LABEL[sec]}>
                    {classes.filter((c) => c.section === sec).map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="field"><span className="lbl">Previous school (optional)</span><input name="previousSchool" maxLength={150} /></label>
            <label className="field span2"><span className="lbl">Additional information (optional)</span><textarea name="notes" rows={3} maxLength={1000} /></label>
          </ActionForm>
        </div>
      </section>
    </>
  );
}
