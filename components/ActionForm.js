'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const isRedirect = (e) => e && String(e.digest || '').startsWith('NEXT_REDIRECT');

// A form that calls a server action, shows the result, and refreshes the page.
export default function ActionForm({
  action, children, submit = 'Save changes', className = '', confirm, resetOnSuccess = false,
  replaceOnSuccess = false, submitClass = 'btn btn-primary', showSubmit = true,
}) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState(null);
  const [nonce, setNonce] = useState(0);
  const router = useRouter();

  function onSubmit(e) {
    e.preventDefault();
    if (pending) return;
    const submitter = e.nativeEvent && e.nativeEvent.submitter;
    const ask = (submitter && submitter.dataset && submitter.dataset.confirm) || confirm;
    if (ask && !window.confirm(ask)) return;
    const fd = new FormData(e.currentTarget);
    if (submitter && submitter.name) fd.set(submitter.name, submitter.value);
    setRes(null);
    start(async () => {
      try {
        const r = await action(fd);
        if (r) {
          setRes(r);
          if (r.ok) {
            if (resetOnSuccess || r.reset) setNonce((n) => n + 1);
            router.refresh();
          }
        }
      } catch (err) {
        if (isRedirect(err)) throw err;
        setRes({ ok: false, error: 'Something went wrong. Please check your connection and try again.' });
      }
    });
  }

  if (replaceOnSuccess && res && res.ok) {
    return <div className="notice ok" role="status">{res.message}</div>;
  }

  return (
    <form key={nonce} onSubmit={onSubmit}>
      {res && !res.ok && <div className={'notice ' + (res.restricted ? 'warn' : 'err')} role="alert">{res.error}</div>}
      {res && res.ok && res.message && <div className="notice ok" role="status">{res.message}</div>}
      <div className={className + (pending ? ' is-pending' : '')}>
        {children}
        {showSubmit && (
          <button type="submit" className={submitClass} disabled={pending}>
            {pending ? 'Please wait…' : submit}
          </button>
        )}
      </div>
    </form>
  );
}
