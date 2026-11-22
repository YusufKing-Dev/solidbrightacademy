'use client';

import { useEffect, useState } from 'react';

// Invisible spam traps for public forms.
export default function HoneyFields() {
  const [ts, setTs] = useState('');
  useEffect(() => setTs(String(Date.now())), []);
  return (
    <>
      <input type="hidden" name="ts" value={ts} readOnly />
      <div className="hp" aria-hidden="true">
        <label>Leave this empty<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
    </>
  );
}
