import ActionForm from '@/components/ActionForm';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function QuestionForm({ action, q, submit = 'Save question', reset = false }) {
  return (
    <ActionForm action={action} submit={submit} className="form-grid" resetOnSuccess={reset}>
      <label className="field"><span className="lbl req">Question</span><textarea name="text" required rows={3} defaultValue={q?.text || ''} maxLength={3000} /></label>
      <div className="field">
        <span className="lbl">Answer options (tick the correct one)</span>
        {LETTERS.map((L, i) => (
          <label key={L} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <input type="radio" name="correct" value={i} required={i === 0} defaultChecked={q ? q.correctIndex === i : false} aria-label={`Option ${L} is correct`} />
            <input name={'opt' + i} defaultValue={q?.options?.[i] || ''} maxLength={500} placeholder={`Option ${L}${i > 1 ? ' (optional)' : ''}`} required={i < 2} style={{ flex: 1 }} />
          </label>
        ))}
      </div>
      <label className="field"><span className="lbl">Marks</span><input name="marks" type="number" min="0.5" max="100" step="0.5" defaultValue={q?.marks || 1} style={{ maxWidth: 120 }} /></label>
    </ActionForm>
  );
}