'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveAnswers, submitAttempt } from '@/lib/actions/cbt-student';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${String(m).padStart(2, '0')}:${x}`;
};

export default function CbtRunner({ attemptId, title, questions, initialAnswers, deadline, serverNow }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers || {});
  const [left, setLeft] = useState(Math.max(0, deadline - serverNow));
  const [saving, setSaving] = useState('saved');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const offset = useRef(serverNow - Date.now());
  const answersRef = useRef(answers);
  const saveTimer = useRef(null);
  const sending = useRef(false);
  const finished = useRef(false);
  answersRef.current = answers;

  const doSubmit = useCallback(async () => {
    if (sending.current || finished.current) return;
    sending.current = true;
    setBusy(true);
    setErr('');
    try {
      clearTimeout(saveTimer.current);
      const r = await submitAttempt(attemptId, answersRef.current);
      if (r && r.ok) { finished.current = true; router.refresh(); return; }
      setErr((r && r.error) || 'Could not submit. Please try again.');
    } catch (e) {
      setErr('No connection. Keep this page open. It will try again.');
    }
    sending.current = false;
    setBusy(false);
  }, [attemptId, router]);

  useEffect(() => {
    const t = setInterval(() => {
      const rem = deadline - (Date.now() + offset.current);
      setLeft(Math.max(0, rem));
      if (rem <= 0) doSubmit();
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, doSubmit]);

  function pick(q, idx) {
    const next = { ...answersRef.current };
    if (next[q.id] === idx) delete next[q.id]; else next[q.id] = idx;
    setAnswers(next);
    answersRef.current = next;
    setSaving('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const r = await saveAnswers(attemptId, answersRef.current);
        setSaving(r && r.ok ? 'saved' : 'error');
      } catch (e) { setSaving('error'); }
    }, 300);
  }

  function submitNow() {
    const missing = questions.filter((q) => answers[q.id] === undefined).length;
    const msg = missing
      ? `You have ${missing} unanswered question${missing > 1 ? 's' : ''}. Submit anyway? You cannot change your answers after this.`
      : 'Submit your exam now? You cannot change your answers after this.';
    if (window.confirm(msg)) doSubmit();
  }

  const q = questions[i];
  const answered = questions.filter((x) => answers[x.id] !== undefined).length;

  return (
    <>
      <div className="cbt-bar">
        <div><h1>{title}</h1><span className="cbt-save">{answered} of {questions.length} answered. {saving === 'saving' ? 'Saving...' : saving === 'error' ? 'Not saved yet, check your connection.' : 'Saved.'}</span></div>
        <div className={'cbt-timer' + (left < 60000 ? ' low' : '')} role="timer" aria-label="Time left">{fmt(left)}</div>
      </div>

      {err && <div className="notice err" role="alert">{err}</div>}

      <div className="panel">
        <p className="muted small">Question {i + 1} of {questions.length}</p>
        <div className="cbt-q">{q.text}</div>
        {q.options.map((o, k) => (
          <button type="button" key={k} className={'cbt-opt' + (answers[q.id] === k ? ' sel' : '')} onClick={() => pick(q, k)} aria-pressed={answers[q.id] === k}>
            <b>{LETTERS[k]}</b><span>{o}</span>
          </button>
        ))}
        <p className="muted small">Tap your chosen answer again to clear it.</p>
        <div className="cbt-nav">
          <button type="button" className="btn btn-outline" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button>
          {i < questions.length - 1
            ? <button type="button" className="btn btn-primary" onClick={() => setI(i + 1)}>Next</button>
            : <button type="button" className="btn btn-yellow" disabled={busy} onClick={submitNow}>{busy ? 'Submitting...' : 'Submit exam'}</button>}
        </div>
      </div>

      <div className="panel">
        <h2>All questions</h2>
        <div className="cbt-pal">
          {questions.map((x, k) => (
            <button type="button" key={x.id} className={(answers[x.id] !== undefined ? 'done ' : '') + (k === i ? 'cur' : '')} onClick={() => setI(k)} aria-label={`Question ${k + 1}${answers[x.id] !== undefined ? ', answered' : ''}`}>{k + 1}</button>
          ))}
        </div>
        <p style={{ marginTop: 16 }}><button type="button" className="btn btn-yellow" disabled={busy} onClick={submitNow}>{busy ? 'Submitting...' : 'Submit exam'}</button></p>
      </div>
    </>
  );
}