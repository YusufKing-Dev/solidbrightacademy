import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getScoreLimits } from '@/lib/academic';
import ActionForm from '@/components/ActionForm';
import { saveGrading } from '@/lib/actions/admin-academic';

export const metadata = { title: 'Grading', robots: { index: false, follow: false } };

export default async function Grading() {
  await requireUser('ADMIN');
  const bands = await prisma.gradeBand.findMany({ orderBy: { minScore: 'desc' } });
  const limits = await getScoreLimits();
  const rows = [...bands, ...Array.from({ length: 3 }, () => ({ minScore: '', maxScore: '', grade: '', remark: '' }))];
  return (
    <>
      <div className="page-title"><h1>Grading system</h1><p>Teachers’ totals and grades are worked out from this table.</p></div>
      <div className="panel">
        <ActionForm action={saveGrading} submit="Save grading system">
          <div className="form-grid two" style={{ marginBottom: 16 }}>
            <label className="field"><span className="lbl">Maximum continuous assessment (CA) mark</span><input name="maxCA" type="number" min="0" max="100" defaultValue={limits.maxCA} required /></label>
            <label className="field"><span className="lbl">Maximum exam mark</span><input name="maxExam" type="number" min="1" max="100" defaultValue={limits.maxExam} required /></label>
          </div>
          <p className="muted small">The total is CA plus exam, so the top grade must reach {limits.maxTotal} with the current marks. Every score needs a grade and ranges must not overlap. Leave a row empty to remove it.</p>
          <div className="table-wrap">
            <table className="rtable">
              <thead><tr><th>From</th><th>To</th><th>Grade</th><th>Remark</th></tr></thead>
              <tbody>{rows.map((b, i) => (
                <tr key={i}>
                  <td data-label="From"><input className="num" type="number" name="minScore" defaultValue={b.minScore} min="0" /></td>
                  <td data-label="To"><input className="num" type="number" name="maxScore" defaultValue={b.maxScore} min="0" /></td>
                  <td data-label="Grade"><input className="num" name="grade" defaultValue={b.grade} maxLength={6} /></td>
                  <td data-label="Remark" className="wide"><input name="remark" defaultValue={b.remark} maxLength={40} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </ActionForm>
      </div>
    </>
  );
}
