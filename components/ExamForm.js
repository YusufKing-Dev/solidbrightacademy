import ActionForm from '@/components/ActionForm';
import { toLagosInput } from '@/lib/cbt';

export default function ExamForm({ action, exam, targets, submit = 'Save exam' }) {
  const e = exam || {};
  return (
    <ActionForm action={action} submit={submit} className="form-grid two">
      <label className="field span2"><span className="lbl req">Exam title</span>
        <input name="title" required defaultValue={e.title || ''} maxLength={150} placeholder="e.g. Mathematics first term test" />
      </label>
      <label className="field span2"><span className="lbl req">Class and subject</span>
        <select name="target" required defaultValue={e.classId ? `${e.classId}:${e.subjectId}` : ''}>
          <option value="" disabled>Select a class and subject</option>
          {targets.map((t) => (
            <optgroup key={t.classId} label={t.className}>
              {t.subjects.map((s) => (<option key={s.id} value={`${t.classId}:${s.id}`}>{t.className}: {s.name}</option>))}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="field"><span className="lbl req">Time allowed (minutes)</span>
        <input name="durationMinutes" type="number" min="5" max="300" required defaultValue={e.durationMinutes || 30} inputMode="numeric" />
      </label>
      <div />
      <label className="field"><span className="lbl">Opens at (optional)</span><input name="startsAt" type="datetime-local" defaultValue={toLagosInput(e.startsAt)} /><span className="help">Nigerian time. Leave empty to open as soon as it is published.</span></label>
      <label className="field"><span className="lbl">Closes at (optional)</span><input name="endsAt" type="datetime-local" defaultValue={toLagosInput(e.endsAt)} /><span className="help">A student’s timer never runs past this time.</span></label>
      <label className="field span2"><span className="lbl">Instructions for students (optional)</span><textarea name="instructions" rows={3} defaultValue={e.instructions || ''} maxLength={2000} /></label>
      <label className="check span2"><input type="checkbox" name="shuffle" defaultChecked={exam ? e.shuffle : true} /> Mix up the order of questions for each student</label>
      <label className="check span2"><input type="checkbox" name="showResult" defaultChecked={exam ? e.showResult : true} /> Show students their score as soon as they submit</label>
    </ActionForm>
  );
}