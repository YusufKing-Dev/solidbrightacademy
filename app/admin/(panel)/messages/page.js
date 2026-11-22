import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import ActionButton from '@/components/ActionButton';
import { setMessageRead, deleteMessage } from '@/lib/actions/admin-site';
import { fmtDateTime } from '@/lib/utils';

export const metadata = { title: 'Messages', robots: { index: false, follow: false } };

export default async function Messages() {
  await requireUser('ADMIN');
  const msgs = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return (
    <>
      <div className="page-title"><h1>Messages</h1><p>Messages sent through the website contact form.</p></div>
      {msgs.length === 0 ? <div className="panel empty"><strong>No messages yet</strong>Messages from the contact page appear here.</div> : msgs.map((m) => (
        <div className="panel" key={m.id} style={m.isRead ? undefined : { borderLeft: '5px solid var(--yellow)' }}>
          <div className="panel-head"><h2>{m.subject || 'Message from ' + m.name}</h2>{!m.isRead && <span className="pill yellow">New</span>}</div>
          <p className="muted small">{m.name}, <a href={`mailto:${m.email}`}>{m.email}</a>{m.phone && <>, <a href={`tel:${m.phone}`}>{m.phone}</a></>}. {fmtDateTime(m.createdAt)}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{m.message}</p>
          <div className="row">
            <ActionButton action={setMessageRead.bind(null, m.id, !m.isRead)}>{m.isRead ? 'Mark as unread' : 'Mark as read'}</ActionButton>
            <ActionButton action={deleteMessage.bind(null, m.id)} className="btn btn-small btn-danger" confirm="Delete this message?">Delete</ActionButton>
          </div>
        </div>
      ))}
    </>
  );
}
