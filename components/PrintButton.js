'use client';

export default function PrintButton({ children = 'Print this result' }) {
  return <button type="button" className="btn btn-outline btn-small no-print" onClick={() => window.print()}>{children}</button>;
}
