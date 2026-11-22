'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// ON/OFF switch for a student's portal access. Saved and enforced by the server.
export default function PortalToggle({ action, enabled, name }) {
  const [on, setOn] = useState(enabled);
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  useEffect(() => setOn(enabled), [enabled]);

  function toggle() {
    const next = !on;
    if (!next && !window.confirm(`Switch OFF portal access for ${name}? They will be blocked immediately.`)) return;
    setOn(next);
    setErr('');
    start(async () => {
      try {
        const r = await action(next);
        if (r && !r.ok) { setOn(!next); setErr(r.error); } else router.refresh();
      } catch (e) {
        setOn(!next);
        setErr('Could not save. Try again.');
      }
    });
  }

  return (
    <span className="toggle-wrap">
      <button type="button" role="switch" aria-checked={on} aria-label={`Portal access for ${name}`} className={'switch' + (on ? ' on' : '')} onClick={toggle} disabled={pending}>
        <span className="knob" />
      </button>
      <span className={'toggle-label ' + (on ? 'is-on' : 'is-off')}>{on ? 'ON' : 'OFF'}</span>
      {err && <span className="inline-err">{err}</span>}
    </span>
  );
}
