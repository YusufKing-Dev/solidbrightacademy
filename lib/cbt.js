import { prisma } from './db';

// "2026-11-21T09:30" typed in Nigerian time (UTC+1, no daylight saving) -> Date
export function parseLagos(v) {
  const s = String(v || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return null;
  const d = new Date(s + ':00+01:00');
  return Number.isNaN(d.getTime()) ? null : d;
}
export const toLagosInput = (d) => (d ? new Date(new Date(d).getTime() + 3600000).toISOString().slice(0, 16) : '');

// Teachers can paste many questions at once. Format (blank line between questions):
//   1. What is 2 + 2?
//   A. 3
//   B. 4*          <- the * marks the correct answer (or write "Answer: B")
//   C. 5
export function parseBulk(text) {
  const blocks = String(text || '').replace(/\r/g, '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const questions = [];
  const errors = [];
  blocks.forEach((b, n) => {
    const qLines = [];
    const opts = [];
    let correct = -1;
    let letter = null;
    for (const raw of b.split('\n')) {
      const l = raw.trim();
      if (!l) continue;
      const ans = /^(?:answer|ans|correct)\s*[:\-]\s*\(?([A-Ea-e])\)?\s*$/i.exec(l);
      if (ans) { letter = ans[1].toUpperCase(); continue; }
      const o = /^\(?([A-Ea-e])[.):]\s*(.+)$/.exec(l);
      if (o && (opts.length > 0 || o[1].toUpperCase() === 'A')) {
        let t = o[2].trim();
        if (/\s*\*+$/.test(t)) { t = t.replace(/\s*\*+$/, '').trim(); correct = opts.length; }
        opts.push(t);
        continue;
      }
      if (opts.length === 0) qLines.push(l.replace(/^(?:Q(?:uestion)?\s*)?\d+\s*[.):]\s*/i, ''));
    }
    if (letter) correct = letter.charCodeAt(0) - 65;
    const text1 = qLines.join('\n').trim();
    if (!text1) errors.push(`Question ${n + 1}: no question text found.`);
    else if (opts.length < 2) errors.push(`Question ${n + 1}: needs at least two options (A, B ...).`);
    else if (opts.length > 5) errors.push(`Question ${n + 1}: at most five options (A to E).`);
    else if (opts.some((x) => !x)) errors.push(`Question ${n + 1}: an option is empty.`);
    else if (correct < 0 || correct >= opts.length) errors.push(`Question ${n + 1}: mark the correct option with * or add a line like "Answer: B".`);
    else questions.push({ text: text1, options: opts, correctIndex: correct });
  });
  return { questions, errors };
}

// Keeps only answers that belong to this exam and point at a real option.
export function cleanAnswers(raw, questions) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const q of questions) {
    const v = raw[q.id];
    if (Number.isInteger(v) && v >= 0 && v < q.options.length) out[q.id] = v;
  }
  return out;
}

// Marks an attempt and stores the score. Correct answers never leave the server.
export async function gradeAttempt(attempt, answers, at) {
  const questions = await prisma.cbtQuestion.findMany({ where: { examId: attempt.examId } });
  const clean = cleanAnswers(answers || attempt.answers, questions);
  let score = 0;
  let total = 0;
  for (const q of questions) {
    total += q.marks;
    if (clean[q.id] === q.correctIndex) score += q.marks;
  }
  return prisma.cbtAttempt.update({
    where: { id: attempt.id },
    data: { submittedAt: at || new Date(), score: Math.round(score * 100) / 100, totalMarks: Math.round(total * 100) / 100, answers: clean },
  });
}

// Anyone who ran out of time without pressing Submit is marked automatically.
export async function finalizeExpired(where) {
  const list = await prisma.cbtAttempt.findMany({ where: { ...where, submittedAt: null, deadline: { lt: new Date() } } });
  for (const a of list) await gradeAttempt(a, null, a.deadline);
  return list.length;
}

export const pct = (score, total) => (total > 0 ? Math.round((score / total) * 1000) / 10 : 0);

// Classes the teacher is assigned to, each with its subjects (for the exam form).
export async function teacherTargets(user) {
  const links = await prisma.teacherClass.findMany({
    where: { teacherId: user.teacher.id },
    include: { class: { include: { classSubjects: { include: { subject: true } } } } },
    orderBy: { class: { sortOrder: 'asc' } },
  });
  return links.map((l) => ({
    classId: l.classId,
    className: l.class.name,
    subjects: l.class.classSubjects.map((cs) => cs.subject).sort((a, b) => a.name.localeCompare(b.name)),
  }));
}