import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getCurrent } from '@/lib/academic';
import ActionForm from '@/components/ActionForm';
import { saveClassFees } from '@/lib/actions/admin-academic';
import { SECTION_LABEL, TERM_NAMES } from '@/lib/utils';

export const metadata = { title: 'School fees', robots: { index: false, follow: false } };

export default async function Fees({ searchParams }) {
  await requireUser('ADMIN');
  const { term: curTerm } = await getCurrent();
  const terms = await prisma.term.findMany({
    include: { session: true },
    orderBy: [{ session: { name: 'desc' } }, { number: 'asc' }],
  });
  const picked =
    terms.find((t) => t.id === searchParams?.termId) ||
    terms.find((t) => t.id === curTerm?.id) ||
    terms[0];

  const classes = await prisma.schoolClass.findMany({ orderBy: { sortOrder: 'asc' } });
  const fees = picked ? await prisma.classFee.findMany({ where: { termId: picked.id } }) : [];
  const feeOf = Object.fromEntries(fees.map((f) => [f.classId, f.amount]));

  return (
    <>
      <div className="page-title">
        <h1>School fees</h1>
        <p>Set the total fee for each class, for each term. Students whose portal is switched off see their class fee on the login page.</p>
      </div>

      {!picked ? (
        <div className="notice warn">Create a session first on the Session and term page.</div>
      ) : (
        <>
          <div className="panel">
            <form method="get" className="toolbar">
              <label className="field">
                <span className="lbl">Session and term</span>
                <select name="termId" defaultValue={picked.id}>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.session.name}, {TERM_NAMES[t.number]}{t.id === curTerm?.id ? ' (current)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-outline" type="submit">Show</button>
              <Link href="/admin/fees" className="btn btn-ghost">Current term</Link>
            </form>
          </div>

          <div className="panel">
            <h2>{picked.session.name}, {TERM_NAMES[picked.number]}</h2>
            {classes.length === 0 ? (
              <div className="empty"><strong>No classes yet</strong></div>
            ) : (
              <ActionForm key={picked.id} action={saveClassFees.bind(null, picked.id)} submit="Save fees" className="form-grid">
                <div className="table-wrap">
                  <table className="rtable">
                    <thead><tr><th>Class</th><th>Section</th><th>Total fee (₦)</th></tr></thead>
                    <tbody>
                      {classes.map((c) => (
                        <tr key={c.id}>
                          <td data-label="Class"><strong>{c.name}</strong></td>
                          <td data-label="Section">{SECTION_LABEL[c.section]}</td>
                          <td data-label="Total fee (₦)">
                            <input name={`fee_${c.id}`} inputMode="numeric" defaultValue={feeOf[c.id] ?? ''} placeholder="e.g. 45000" aria-label={`Fee for ${c.name}`} style={{ maxWidth: 180 }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="muted small">Leave a box empty if no fee is set for that class. Commas are fine.</p>
              </ActionForm>
            )}
          </div>
        </>
      )}
    </>
  );
}