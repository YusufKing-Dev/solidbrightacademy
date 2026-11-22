'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser, assertTeacherClass } from '@/lib/auth';
import { getCurrent } from '@/lib/academic';
import { audit } from '@/lib/audit';
import { parseLagos, parseBulk } from '@/lib/cbt';
import { str, ok, fail } from '@/lib/utils';

// scope is only a hint about which login to require. The real check is that the
// matching administrator or teacher is genuinely logged in.
async function ctx(scope) {
  if (scope === 'admin') return { user: await requireUser('ADMIN'), admin: true };
  return { user: await requireUser('TEACHER'), admin: false };
}
async function canManage(c, classId) {
  return c.admin || !!(await assertTeacherClass(c.user, classId));
}
async function loadManaged(c, id) {
  const exam = await prisma.cbtExam.findUnique({ where: { id }, include: { _count: { select: { questions: true, attempts: true } } } });
  if (!exam || !(await canManage(c, exam.classId))) return null;
  return exam;
}
const touch = (id) => {
  revalidatePath('/teacher/cbt');
  revalidatePath('/admin/cbt');
  revalidatePath('/student/cbt');
  if (id) {
    revalidatePath(`/teacher/cbt/${id}`);
    revalidatePath(`/admin/cbt/${id}`);
    revalidatePath(`/student/cbt/${id}`);
  }
};

// ------------------------------------------------------------------ the exam
export async function saveExam(id, fd) {
  const c = await ctx('teacher');
  const title = str(fd, 'title', 150);
  const instructions = str(fd, 'instructions', 2000) || null;
  const [classId, subjectId] = str(fd, 'target', 100).split(':');
  const duration = parseInt(str(fd, 'durationMinutes', 4), 10);
  if (title.length < 3) return fail('Enter a title for the exam.');
  if (!classId || !subjectId) return fail('Choose the class and subject.');
  if (!(duration >= 5 && duration <= 300)) return fail('The time allowed must be between 5 and 300 minutes.');
  if (!(await canManage(c, classId))) return fail('You are not assigned to that class.');
  if (!(await prisma.classSubject.findUnique({ where: { classId_subjectId: { classId, subjectId } } }))) {
    return fail('That subject is not offered in the chosen class.');
  }
  const startsAt = parseLagos(fd.get('startsAt'));
  const endsAt = parseLagos(fd.get('endsAt'));
  if (startsAt && endsAt && endsAt <= startsAt) return fail('The closing time must be after the opening time.');
  const data = {
    title, instructions, classId, subjectId, durationMinutes: duration, startsAt, endsAt,
    shuffle: fd.get('shuffle') === 'on', showResult: fd.get('showResult') === 'on',
  };

  if (id === 'new') {
    const { term } = await getCurrent();
    const e = await prisma.cbtExam.create({ data: { ...data, termId: term?.id || null, teacherId: c.user.teacher.id } });
    await audit(c.user, 'CBT_CREATED', 'cbt', e.id, title);
    touch();
    redirect(`/teacher/cbt/${e.id}`);
  }
  const exam = await loadManaged(c, id);
  if (!exam) return fail('Exam not found.');
  if (exam._count.attempts > 0 && (exam.classId !== classId || exam.subjectId !== subjectId)) {
    return fail('Students have already taken this exam, so its class and subject cannot be changed.');
  }
  await prisma.cbtExam.update({ where: { id }, data });
  await audit(c.user, 'CBT_UPDATED', 'cbt', id, title);
  touch(id);
  return ok('Exam settings saved.');
}

export async function setExamPublished(scope, id, publish) {
  const c = await ctx(scope);
  const exam = await loadManaged(c, id);
  if (!exam) return fail('Exam not found.');
  if (publish && exam._count.questions === 0) return fail('Add at least one question before publishing.');
  await prisma.cbtExam.update({ where: { id }, data: { published: !!publish } });
  await audit(c.user, publish ? 'CBT_PUBLISHED' : 'CBT_UNPUBLISHED', 'cbt', id, exam.title);
  touch(id);
  return ok(publish ? 'Published. Students in the class can now see it.' : 'Unpublished. Students can no longer start it.');
}

export async function deleteExam(scope, id) {
  const c = await ctx(scope);
  const exam = await loadManaged(c, id);
  if (!exam) return fail('Exam not found.');
  await prisma.cbtExam.delete({ where: { id } });
  await audit(c.user, 'CBT_DELETED', 'cbt', id, exam.title);
  touch();
  redirect(scope === 'admin' ? '/admin/cbt' : '/teacher/cbt');
}

export async function resetAttempt(scope, examId, studentId) {
  const c = await ctx(scope);
  const exam = await loadManaged(c, examId);
  if (!exam) return fail('Exam not found.');
  await prisma.cbtAttempt.deleteMany({ where: { examId, studentId } });
  await audit(c.user, 'CBT_ATTEMPT_RESET', 'cbt', examId, 'A student was allowed to retake the exam');
  touch(examId);
  return ok('Attempt cleared. The student can take the exam again.');
}

// ----------------------------------------------------------------- questions
function readQuestion(fd) {
  const text = str(fd, 'text', 3000);
  const picked = parseInt(str(fd, 'correct', 2), 10);
  const options = [];
  let correctIndex = -1;
  for (let i = 0; i < 5; i++) {
    const t = str(fd, 'opt' + i, 500);
    if (!t) continue;
    if (i === picked) correctIndex = options.length;
    options.push(t);
  }
  const marks = Math.round((parseFloat(str(fd, 'marks', 6)) || 1) * 100) / 100;
  if (text.length < 3) return { error: 'Write the question.' };
  if (options.length < 2) return { error: 'Give at least two answer options.' };
  if (correctIndex < 0) return { error: 'Choose which option is correct. It must have text.' };
  if (!(marks > 0 && marks <= 100)) return { error: 'Marks must be between 0 and 100.' };
  return { text, options, correctIndex, marks };
}

async function editable(c, examId) {
  const exam = await loadManaged(c, examId);
  if (!exam) return { error: 'Exam not found.' };
  if (exam._count.attempts > 0) return { error: 'Students have already started this exam, so its questions are locked. Clear their attempts first, or create a new exam.' };
  return { exam };
}

export async function saveQuestion(examId, qid, fd) {
  const c = await ctx('teacher');
  const g = await editable(c, examId);
  if (g.error) return fail(g.error);
  const q = readQuestion(fd);
  if (q.error) return fail(q.error);
  if (qid === 'new') {
    const last = await prisma.cbtQuestion.findFirst({ where: { examId }, orderBy: { sortOrder: 'desc' } });
    await prisma.cbtQuestion.create({ data: { ...q, examId, sortOrder: (last?.sortOrder ?? 0) + 1 } });
    touch(examId);
    return ok('Question added.', { reset: true });
  }
  const existing = await prisma.cbtQuestion.findFirst({ where: { id: qid, examId } });
  if (!existing) return fail('Question not found.');
  await prisma.cbtQuestion.update({ where: { id: qid }, data: q });
  touch(examId);
  return ok('Question saved.');
}

export async function deleteQuestion(examId, qid) {
  const c = await ctx('teacher');
  const g = await editable(c, examId);
  if (g.error) return fail(g.error);
  await prisma.cbtQuestion.deleteMany({ where: { id: qid, examId } });
  touch(examId);
  return ok('Question deleted.');
}

export async function importQuestions(examId, fd) {
  const c = await ctx('teacher');
  const g = await editable(c, examId);
  if (g.error) return fail(g.error);
  const { questions, errors } = parseBulk(str(fd, 'bulk', 60000));
  if (errors.length) return fail(errors.slice(0, 3).join(' ') + (errors.length > 3 ? ` (and ${errors.length - 3} more)` : ''));
  if (!questions.length) return fail('Paste at least one question.');
  if (questions.length > 200) return fail('Please import at most 200 questions at a time.');
  const marks = Math.round((parseFloat(str(fd, 'marks', 6)) || 1) * 100) / 100;
  const last = await prisma.cbtQuestion.findFirst({ where: { examId }, orderBy: { sortOrder: 'desc' } });
  let order = last?.sortOrder ?? 0;
  await prisma.cbtQuestion.createMany({ data: questions.map((q) => ({ ...q, examId, marks, sortOrder: ++order })) });
  await audit(c.user, 'CBT_IMPORTED', 'cbt', examId, `${questions.length} questions`);
  touch(examId);
  return ok(`${questions.length} question${questions.length === 1 ? '' : 's'} added.`, { reset: true });
}