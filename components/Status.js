export function SubmissionPill({ status, published }) {
  const map = {
    DRAFT: ['grey', 'Draft'],
    PENDING: ['yellow', 'Pending approval'],
    APPROVED: ['green', 'Approved'],
    REJECTED: ['red', 'Rejected'],
  };
  const [cls, label] = map[status] || ['grey', status];
  return (
    <>
      <span className={'pill ' + cls}>{label}</span>
      {status === 'APPROVED' && (published ? <span className="pill blue" style={{ marginLeft: 6 }}>Published</span> : <span className="pill grey" style={{ marginLeft: 6 }}>Not published</span>)}
    </>
  );
}

export function AppPill({ status }) {
  const map = { PENDING: ['yellow', 'Pending'], REVIEWED: ['blue', 'Reviewed'], ACCEPTED: ['green', 'Accepted'], REJECTED: ['red', 'Rejected'], ARCHIVED: ['grey', 'Archived'] };
  const [cls, label] = map[status] || ['grey', status];
  return <span className={'pill ' + cls}>{label}</span>;
}
