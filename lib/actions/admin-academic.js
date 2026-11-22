'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getCurrent, getGradeBands, getScoreLimits } from '@/lib/academic';
import { parseScoreRows, writeRows } from '@/lib/results';
import { audit } from '@/lib/audit';
import { str, studentName, TERM_NAMES, ok, fail } from '@/lib/utils';

const A = () => requireUser('ADMIN');
const everywhere = () => {
  revalidatePath('/', 'layout');
};

// ---------------------------------------------------------- SESSIONS AND TERMS
export async function createAcademicSession(fd) {
  const admin = await A();
  const name = str(fd, 'name', 9);
  const m = /^(\d{4})\/(\d{4})$/.exec(name);
  if (!m || Number(m[2]) !== Number(m[1]) + 1) return fail('Write the session like 2026/2027.');
  if (await prisma.academicSession.findUnique({ where: { name } })) return fail(`The session ${name} already exists.`);
  const first = (await prisma.academicSession.count()) === 0;
  await prisma.academicSession.create({
    data: {
      name,
      isCurrent: first,
      terms: { create: [1, 2, 3].map((n) => ({ number: n, isCurrent: first && n === 1 })) },
    },
  });
  await audit(admin, 'SESSION_CREATED', 'session', null, name);
  everywhere();
  return ok(`Session ${name} created with 1st, 2nd and 3rd Term.`);
}

export async function renameAcademicSession(id, fd) {
  const admin = await A();
  const name = str(fd, 'name', 9);
  const m = /^(\d{4})\/(\d{4})$/.exec(name);
  if (!m || Number(m[2]) !== Number(m[1]) + 1) return fail('Write the session like 2026/2027.');
  const clash = await prisma.academicSession.findUnique({ where: { name } });
  if (clash && clash.id !== id) return fail(`The session ${name} already exists.`);
  await prisma.academicSession.update({ where: { id }, data: { name } });
  await audit(admin, 'SESSION_RENAMED', 'session', id, name);
  everywhere();
  return ok('Session updated.');
}

// Sets the session and term used by the whole system (all three dashboards,
// result entry, and the default for result management).
export async function setCurrentPeriod(fd) {
  const admin = await A();
  const sessionId = str(fd, 'sessionId', 40);
  const number = parseInt(str(fd, 'termNumber', 2), 10);
  if (![1, 2, 3].includes(number)) return fail('Choose a term.');
  const term = await prisma.term.findUnique({ where: { sessionId_number: { sessionId, number } }, include: { session: true } });
  if (!term) return fail('That session or term does not exist.');
  await prisma.$transaction([
    prisma.academicSession.updateMany({ data: { isCurrent: false } }),
    prisma.term.updateMany({ data: { isCurrent: false } }),
    prisma.academicSession.update({ where: { id: sessionId }, data: { isCurrent: true } }),
    prisma.term.update({ where: { id: term.id }, data: { isCurrent: true } }),
  ]);
  await audit(admin, 'CURRENT_PERIOD_SET', 'session', sessionId, `${term.session.name} ${TERM_NAMES[number]}`);
  everywhere();
  return ok(`Current period is now ${term.session.name}, ${TERM_NAMES[number]}.`);
}

export async function deleteAcademicSession(id) {
  const admin = await A();
  const s = await prisma.academicSession.findUnique({ where: { id }, include: { terms: { include: { _count: { select: { submissions: true } } } } } });
  if (!s) return fail('Session not found.');
  if (s.isCurrent) return fail('You cannot delete the current session. Make another session current first.');
  if (s.terms.some((t) => t._count.submissions > 0)) return fail('This session has result records and cannot be deleted.');
  await prisma.academicSession.delete({ where: { id } });
  await audit(admin, 'SESSION_DELETED', 'session', id, s.name);
  everywhere();
  return ok('Session deleted.');
}

// -------------------------------------------------------------------- SUBJECTS
export async function createSubject(fd) {
  const admin = await A();
  const name = str(fd, 'name', 80);
  if (name.length < 2) return fail('Enter a subject name.');
  if (await prisma.subject.findUnique({ where: { name } })) return fail(`"${name}" already exists.`);
  const s = await prisma.subject.create({ data: { name } });
  await audit(admin, 'SUBJECT_CREATED', 'subject', s.id, name);
  revalidatePath('/admin', 'layout');
  return ok('Subject added. Open a class to switch it on for that class.');
}

export async function renameSubject(id, fd) {
  const admin = await A();
  const name = str(fd, 'name', 80);
  if (name.length < 2) return fail('Enter a subject name.');
  const clash = await prisma.subject.findUnique({ where: { name } });
  if (clash && clash.id !== id) return fail(`"${name}" already exists.`);
  await prisma.subject.update({ where: { id }, data: { name } });
  await audit(admin, 'SUBJECT_RENAMED', 'subject', id, name);
  revalidatePath('/', 'layout');
  return ok('Subject renamed.');
}

export async function deleteSubject(id) {
  const admin = await A();
  const s = await prisma.subject.findUnique({ where: { id }, include: { _count: { select: { submissions: true } } } });
  if (!s) return fail('Subject not found.');
  if (s._count.submissions > 0) return fail('This subject has result records and cannot be deleted.');
  await prisma.subject.delete({ where: { id } });
  await audit(admin, 'SUBJECT_DELETED', 'subject', id, s.name);
  revalidatePath('/admin', 'layout');
  return ok('Subject deleted.');
}

// --------------------------------------------------------------------- GRADING
export async function saveGrading(fd) {
  const admin = await A();
  const maxCA = parseInt(str(fd, 'maxCA', 4), 10);
  const maxExam = parseInt(str(fd, 'maxExam', 4), 10);
  if (!(maxCA >= 0 && maxExam > 0)) return fail('Enter the maximum CA and exam marks.');
  const total = maxCA + maxExam;

  const mins = fd.getAll('minScore'), maxs = fd.getAll('maxScore'), grades = fd.getAll('grade'), remarks = fd.getAll('remark');
  const bands = [];
  for (let i = 0; i < grades.length; i++) {
    const grade = String(grades[i]).trim();
    if (!grade && !String(mins[i]).trim() && !String(maxs[i]).trim()) continue; // empty row
    const minScore = parseInt(mins[i], 10), maxScore = parseInt(maxs[i], 10);
    if (!grade) return fail(`Row ${i + 1}: enter a grade.`);
    if (!Number.isInteger(minScore) || !Number.isInteger(maxScore) || minScore < 0 || maxScore < minScore) {
      return fail(`Row ${i + 1} (${grade}): the score range is not valid.`);
    }
    bands.push({ minScore, maxScore, grade: grade.slice(0, 6), remark: String(remarks[i] || '').trim().slice(0, 40) });
  }
  if (!bands.length) return fail('Add at least one grade.');
  const sorted = [...bands].sort((a, b) => a.minScore - b.minScore);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].minScore <= sorted[i - 1].maxScore) return fail(`The ranges for ${sorted[i - 1].grade} and ${sorted[i].grade} overlap.`);
  }
  for (let n = 0; n <= total; n++) {
    if (!sorted.some((b) => n >= b.minScore && n <= b.maxScore)) {
      return fail(`No grade covers a total of ${n}. Every score from 0 to ${total} needs a grade.`);
    }
  }
  if (sorted[sorted.length - 1].maxScore < total) return fail(`The top grade must reach ${total}.`);

  await prisma.$transaction([
    prisma.gradeBand.deleteMany({}),
    prisma.gradeBand.createMany({ data: bands }),
    prisma.siteSetting.upsert({ where: { key: 'maxCA' }, create: { key: 'maxCA', value: String(maxCA) }, update: { value: String(maxCA) } }),
    prisma.siteSetting.upsert({ where: { key: 'maxExam' }, create: { key: 'maxExam', value: String(maxExam) }, update: { value: String(maxExam) } }),
  ]);
  await audit(admin, 'GRADING_SAVED', 'grading', null, `${bands.length} grades, CA ${maxCA}, Exam ${maxExam}`);
  everywhere();
  return ok('Grading system saved. It applies to results saved from now on.');
}

// ---------------------------------------------------- RESULT REVIEW / APPROVAL
async function loadSub(id) {
  return prisma.resultSubmission.findUnique({ where: { id }, include: { class: true, subject: true } });
}
const label = (s) => `${s.class.name} ${s.subject.name}`;
const refresh = (id) => {
  revalidatePath('/admin/results');
  revalidatePath(`/admin/results/${id}`);
  revalidatePath('/teacher', 'layout');
  revalidatePath('/student', 'layout');
  revalidatePath('/admin');
};

export async function approveSubmission(id, publish) {
  const admin = await A();
  const s = await loadSub(id);
  if (!s) return fail('Submission not found.');
  if (s.status !== 'PENDING') return fail('Only results that are pending approval can be approved.');
  await prisma.resultSubmission.update({
    where: { id },
    data: { status: 'APPROVED', reviewedAt: new Date(), rejectionReason: null, published: !!publish, publishedAt: publish ? new Date() : null },
  });
  await audit(admin, publish ? 'APPROVED_AND_PUBLISHED' : 'APPROVED', 'submission', id, label(s));
  refresh(id);
  return ok(publish ? 'Approved and published. Students can now see these results.' : 'Approved. Publish it when you are ready for students to see it.');
}

export async function rejectSubmission(id, fd) {
  const admin = await A();
  const reason = str(fd, 'reason', 500);
  if (reason.length < 5) return fail('Write a reason so the teacher knows what to correct.');
  const s = await loadSub(id);
  if (!s) return fail('Submission not found.');
  if (s.status !== 'PENDING') return fail('Only results that are pending approval can be rejected.');
  await prisma.resultSubmission.update({
    where: { id },
    data: { status: 'REJECTED', rejectionReason: reason, reviewedAt: new Date(), published: false, publishedAt: null },
  });
  await audit(admin, 'REJECTED', 'submission', id, `${label(s)}: ${reason}`);
  refresh(id);
  return ok('Rejected. The teacher can see your reason and resubmit.');
}

export async function publishSubmission(id) {
  const admin = await A();
  const s = await loadSub(id);
  if (!s) return fail('Submission not found.');
  if (s.status !== 'APPROVED') return fail('Results must be approved before they can be published.');
  await prisma.resultSubmission.update({ where: { id }, data: { published: true, publishedAt: new Date() } });
  await audit(admin, 'PUBLISHED', 'submission', id, label(s));
  refresh(id);
  return ok('Published. Students can now see these results.');
}

export async function unpublishSubmission(id) {
  const admin = await A();
  const s = await loadSub(id);
  if (!s) return fail('Submission not found.');
  await prisma.resultSubmission.update({ where: { id }, data: { published: false } });
  await audit(admin, 'UNPUBLISHED', 'submission', id, label(s));
  refresh(id);
  return ok('Unpublished. Students can no longer see these results.');
}

// The administrator can correct scores in any state. Every correction is logged.
export async function adminSaveResults(id, fd) {
  const admin = await A();
  const s = await loadSub(id);
  if (!s) return fail('Submission not found.');
  const students = await prisma.student.findMany({
    where: { id: { in: (await prisma.result.findMany({ where: { submissionId: id }, select: { studentId: true } })).map((r) => r.studentId) } },
    orderBy: [{ surname: 'asc' }, { firstName: 'asc' }],
  });
  const parsed = parseScoreRows(fd, students, await getScoreLimits(), await getGradeBands());
  if (parsed.error) return fail(parsed.error);
  await writeRows(id, parsed.rows);
  await audit(admin, 'CORRECTED', 'submission', id, `${label(s)}: scores corrected by administrator`);
  refresh(id);
  return ok('Corrections saved.');
}

// ---------------------------------------------------------------- REMARKS
export async function savePrincipalRemarks(classId, fd) {
  const admin = await A();
  const { term } = await getCurrent();
  if (!term) return fail('Set the current term first.');
  const students = await prisma.student.findMany({ where: { classId }, select: { id: true } });
  await prisma.$transaction(
    students.map((st) => {
      const v = str(fd, 'rem_' + st.id, 300) || null;
      return prisma.reportRemark.upsert({
        where: { studentId_termId: { studentId: st.id, termId: term.id } },
        create: { studentId: st.id, termId: term.id, principalRemark: v },
        update: { principalRemark: v },
      });
    })
  );
  await audit(admin, 'PRINCIPAL_REMARKS_SAVED', 'class', classId, 'Principal remarks saved');
  revalidatePath(`/admin/classes/${classId}`);
  return ok('Principal’s remarks saved.');
}

// ----------------------------------------------------------------- SCHOOL FEES
export async function saveClassFees(termId, fd) {
  const admin = await A();
  const term = await prisma.term.findUnique({ where: { id: termId }, include: { session: true } });
  if (!term) return fail('That term does not exist.');
  const classes = await prisma.schoolClass.findMany({ select: { id: true, name: true } });

  const ops = [];
  for (const c of classes) {
    const raw = str(fd, 'fee_' + c.id, 14).replace(/[,\s₦]/g, '');
    if (raw === '') {
      ops.push(prisma.classFee.deleteMany({ where: { classId: c.id, termId } }));
      continue;
    }
    const amount = Number(raw);
    if (!Number.isInteger(amount) || amount < 0 || amount > 100000000) {
      return fail(`${c.name}: enter the fee as a whole number, for example 45000.`);
    }
    ops.push(prisma.classFee.upsert({
      where: { classId_termId: { classId: c.id, termId } },
      create: { classId: c.id, termId, amount },
      update: { amount },
    }));
  }
  await prisma.$transaction(ops);
  await audit(admin, 'FEES_SAVED', 'fees', termId, `${term.session.name} ${TERM_NAMES[term.number]}`);
  everywhere();
  return ok(`School fees saved for ${term.session.name}, ${TERM_NAMES[term.number]}.`);
}