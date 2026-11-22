'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function ActionButton({ action, children, className = 'btn btn-small btn-outline', confirm, title, disabled }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState(null);
  const router = useRouter();

  function click() {
    if (confirm && !window.confirm(confirm)) return;
    setMsg(null);
    start(async () => {
      try {
        const r = await action();
        if (r) {
          setMsg(r);
          if (r.ok) router.refresh();
        }
      } catch (err) {
        if (err && String(err.digest || '').startsWith('NEXT_REDIRECT')) throw err;
        setMsg({ ok: false, error: 'Something went wrong. Please try again.' });
      }
    });
  }

  return (
    <span className="abtn">
      <button type="button" className={className} onClick={click} disabled={pending || disabled} title={title}>
        {pending ? 'Please wait…' : children}
      </button>
      {msg && !msg.ok && <span className="inline-err" role="alert">{msg.error}</span>}
      {msg && msg.ok && msg.message && <span className="inline-ok" role="status">{msg.message}</span>}
    </span>
  );
}
