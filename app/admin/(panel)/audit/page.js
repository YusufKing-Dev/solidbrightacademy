import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { fmtDateTime } from '@/lib/utils';

export const metadata = { title: 'Activity Log', robots: { index: false, follow: false } };

export default async function Audit() {
  await requireUser('ADMIN');
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return (
    <>
      <div className="page-title"><h1>Activity log</h1><p>Important actions, newest first (last 200).</p></div>
      <div className="panel">
        {logs.length === 0 ? <div className="empty"><strong>No activity yet</strong></div> : (
          <div className="table-wrap"><table className="rtable">
            <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>{logs.map((l) => (
              <tr key={l.id}><td data-label="When">{fmtDateTime(l.createdAt)}</td><td data-label="Who">{l.actorName}</td><td data-label="Action">{l.action.replace(/_/g, ' ').toLowerCase()}</td><td data-label="Details" className="wide">{l.details || '-'}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
