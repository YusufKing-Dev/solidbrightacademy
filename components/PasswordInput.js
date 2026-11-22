'use client';

import { useState } from 'react';

export default function PasswordInput({ name, label, autoComplete = 'current-password', required = true, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field">
      <span className="lbl">{label}</span>
      <span className="pw">
        <input name={name} type={show ? 'text' : 'password'} autoComplete={autoComplete} required={required} minLength={minLength} />
        <button type="button" className="pw-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? 'Hide' : 'Show'}
        </button>
      </span>
    </label>
  );
}
