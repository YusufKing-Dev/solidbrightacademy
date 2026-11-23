import ActionForm from '@/components/ActionForm';
import ImageField from '@/components/ImageField';
import { SECTION_LABEL } from '@/lib/utils';

export default function StudentForm({ action, student, classes, suggestion, submit = 'Save student' }) {
  const s = student || {};
  const sections = ['PRE_BASIC', 'BASIC', 'COLLEGE'];
  return (
    <ActionForm action={action} submit={submit} className="form-grid two">
      <label className="field"><span className="lbl req">Admission number</span>
        <input name="admissionNo" required defaultValue={s.admissionNo || suggestion || ''} autoCapitalize="characters" placeholder="SBA/2026/015" />
        <span className="help">This is the student’s login username. It must be unique.</span>
      </label>
      <label className="field"><span className="lbl req">Class</span>
        <select name="classId" required defaultValue={s.classId || ''}>
          <option value="" disabled>Select a class</option>
          {sections.map((sec) => (
            <optgroup key={sec} label={SECTION_LABEL[sec]}>
              {classes.filter((c) => c.section === sec).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </optgroup>
          ))}
        </select>
        <span className="help">The school section follows the class.</span>
      </label>
      <label className="field"><span className="lbl req">Surname</span><input name="surname" required defaultValue={s.surname || ''} maxLength={60} /></label>
      <label className="field"><span className="lbl req">First name</span><input name="firstName" required defaultValue={s.firstName || ''} maxLength={60} /></label>
      <label className="field"><span className="lbl">Other names</span><input name="otherNames" defaultValue={s.otherNames || ''} maxLength={80} /></label>
      <label className="field"><span className="lbl req">Gender</span>
        <select name="gender" required defaultValue={s.gender || ''}><option value="" disabled>Select</option><option>Male</option><option>Female</option></select>
      </label>
      <div className="span2"><ImageField name="photoUrl" label="Photograph" folder="students" round defaultValue={s.photoUrl || ''} /></div>
      {!student && (
        <label className="field span2"><span className="lbl">First password (optional)</span>
          <input name="password" maxLength={60} placeholder="Leave empty to use the surname" />
          <span className="help">By default the student’s first password is their surname. They will be asked to choose a new one at first login.</span>
        </label>
      )}
      <label className="check span2"><input type="checkbox" name="portalEnabled" defaultChecked={student ? s.portalEnabled : true} /> Portal access ON (the student can log in and see published results)</label>
    </ActionForm>
  );
}