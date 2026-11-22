'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { gradeAttempt, cleanAnswers } from '@/lib/cbt';
import { ok, fail } from '@/lib/utils';

const GRACE_MS = 8000; // allowance for slow phone networks when time runs out

function shuffled(ids) {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function startExam(examId) {
  const user = await requireUser('STUDENT');
  const st = user.student;
  const exam = await prisma.cbtExam.findUnique({ where: { id: examId }, include: { questions: { select: { id: true }, orderBy: { sortOrder: 'asc' } } } });
  if (!exam || !exam.published || exam.classId !== st.classId) return fail('This exam is not available to you.');
  const now = new Date();
  if (exam.startsAt && now < exam.startsAt) return fail('This exam has not opened yet.');
  if (exam.endsAt && now > exam.endsAt) return fail('This exam is closed.');
  if (!exam.questions.length) return fail('This exam has no questions yet.');

  const existing = await prisma.cbtAttempt.findUnique({ where: { examId_studentId: { examId, studentId: st.id } } });
  if (!existing) {
    const ids = exam.questions.map((q) => q.id);
    let deadline = new Date(now.getTime() + exam.durationMinutes * 60000);
    if (exam.endsAt && exam.endsAt < deadline) deadline = exam.endsAt;
    try {
      await prisma.cbtAttempt.create({ data: { examId, studentId: st.id, deadline, order: exam.shuffle ? shuffled(ids) : ids, answers: {} } });
    } catch (e) { /* a double tap already created it */ }
  }
  revalidatePath(`/student/cbt/${examId}`);
  redirect(`/student/cbt/${examId}`);
}

async function myAttempt(attemptId) {
  const user = await requireUser('STUDENT');
  return prisma.cbtAttempt.findFirst({ where: { id: attemptId, studentId: user.student.id } });
}

// Called while the student answers. Works from the full answer set each time.
export async function saveAnswers(attemptId, raw) {
  const a = await myAttempt(attemptId);
  if (!a) return fail('Attempt not found.');
  if (a.submittedAt) return fail('This exam was already submitted.');
  if (Date.now() > a.deadline.getTime() + GRACE_MS) return fail('Time is up.');
  const questions = await prisma.cbtQuestion.findMany({ where: { examId: a.examId }, select: { id: true, options: true } });
  await prisma.cbtAttempt.update({ where: { id: a.id }, data: { answers: cleanAnswers(raw, questions) } });
  return ok('');
}

export async function submitAttempt(attemptId, raw) {
  const a = await myAttempt(attemptId);
  if (!a) return fail('Attempt not found.');
  if (a.submittedAt) return ok('Already submitted.');
  const inTime = Date.now() <= a.deadline.getTime() + GRACE_MS;
  await gradeAttempt(a, inTime ? raw : null, inTime ? new Date() : a.deadline);
  revalidatePath(`/student/cbt/${a.examId}`);
  revalidatePath(`/teacher/cbt/${a.examId}/results`);
  revalidatePath(`/admin/cbt/${a.examId}`);
  return ok('Your exam has been submitted.');
}