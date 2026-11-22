import ActionForm from '@/components/ActionForm';
import { SECTION_LABEL } from '@/lib/utils';

export default function TeacherForm({ action, teacher, classes, submit = 'Save teacher' }) {
  const t = teacher;
  const assigned = new Set((t?.assignments || []).map((a) => a.classId));
  return (
    <ActionForm action={action} submit={submit} className="form-grid two">
      <label className="field"><span className="lbl req">Full name</span><input name="fullName" required defaultValue={t?.fullName || ''} maxLength={100} /></label>
      <label className="field"><span className="lbl">Display name</span><input name="displayName" defaultValue={t?.displayName || ''} maxLength={100} placeholder="Shown on dashboards, e.g. Mrs. Bello" /></label>
      <label className="field"><span className="lbl req">Login name</span>
        <input name="username" required defaultValue={t?.user?.username || ''} maxLength={60} autoCapitalize="none" placeholder="Mrs. Bello" />
        <span className="help">The teacher types this to log in. It must be unique. If two teachers share a name, add a number, for example “Mrs. Bello 2”.</span>
      </label>
      {!t && (
        <label className="field"><span className="lbl req">Password</span><input name="password" required minLength={6} maxLength={60} /><span className="help">At least 6 characters. The teacher is asked to choose a new one at first login.</span></label>
      )}
      <label className="field"><span className="lbl">Phone</span><input name="phone" type="tel" defaultValue={t?.phone || ''} inputMode="tel" /></label>
      <label className="field"><span className="lbl">Email</span><input name="email" type="email" defaultValue={t?.email || ''} /></label>
      <div className="field span2">
        <span className="lbl">Assigned classes</span>
        <div className="checks">
          {classes.map((c) => (
            <label key={c.id} className="check"><input type="checkbox" name="classIds" value={c.id} defaultChecked={assigned.has(c.id)} /> {c.name} <span className="muted small">({SECTION_LABEL[c.section]})</span></label>
          ))}
        </div>
      </div>
      {t && <label className="check span2"><input type="checkbox" name="active" defaultChecked={t.user.active} /> Account active (untick to deactivate)</label>}
    </ActionForm>
  );
}
