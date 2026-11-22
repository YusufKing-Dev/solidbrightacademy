'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireUser, assertTeacherClass } from '@/lib/auth';
import { getCurrent, getGradeBands, getScoreLimits } from '@/lib/academic';
import { parseScoreRows, checkSubmittable, writeRows } from '@/lib/results';
import { audit } from '@/lib/audit';
import { str, ok, fail } from '@/lib/utils';

// Save a draft or submit results for approval. The term and session are ALWAYS
// taken from the administrator's current settings, never from the browser.
export async function saveResults(classId, subjectId, fd) {
  const user = await requireUser('TEACHER');
  const cls = await assertTeacherClass(user, classId);
  if (!cls) return fail('You are not assigned to this class.');

  const { term } = await getCurrent();
  if (!term) return fail('No current term has been set by the administrator yet.');

  const cs = await prisma.classSubject.findUnique({ where: { classId_subjectId: { classId, subjectId } } });
  if (!cs) return fail('This subject is not offered in this class.');

  let sub = await prisma.resultSubmission.findUnique({
    where: { classId_subjectId_termId: { classId, subjectId, termId: term.id } },
  });
  if (sub && (sub.status === 'PENDING' || sub.status === 'APPROVED')) {
    return fail(sub.status === 'PENDING' ? 'These results are awaiting approval and cannot be changed.' : 'These results have been approved and can no longer be changed by a teacher.');
  }

  const students = await prisma.student.findMany({
    where: { classId, user: { active: true } },
    orderBy: [{ surname: 'asc' }, { firstName: 'asc' }],
  });
  if (!students.length) return fail('This class has no students yet.');

  const [limits, bands] = [await getScoreLimits(), await getGradeBands()];
  const parsed = parseScoreRows(fd, students, limits, bands);
  if (parsed.error) return fail(parsed.error);

  const intent = str(fd, 'intent', 10) === 'submit' ? 'submit' : 'draft';
  if (intent === 'submit') {
    const problem = checkSubmittable(parsed.rows);
    if (problem) return fail(problem);
  }

  if (!sub) {
    sub = await prisma.resultSubmission.create({
      data: { classId, subjectId, termId: term.id, teacherId: user.teacher.id },
    });
  }
  await writeRows(sub.id, parsed.rows);

  if (intent === 'submit') {
    await prisma.resultSubmission.update({
      where: { id: sub.id },
      data: { status: 'PENDING', submittedAt: new Date(), teacherId: user.teacher.id, rejectionReason: null, published: false },
    });
    await audit(user, 'SUBMITTED', 'submission', sub.id, `${cls.name} results submitted for approval`);
  } else {
    await prisma.resultSubmission.update({ where: { id: sub.id }, data: { teacherId: user.teacher.id } });
    await audit(user, 'DRAFT_SAVED', 'submission', sub.id, `${cls.name} draft saved`);
  }

  revalidatePath('/teacher', 'layout');
  revalidatePath('/admin/results');
  return ok(intent === 'submit' ? 'Results submitted for approval.' : 'Draft saved.');
}

// Class teacher's remark for each pupil, for the current term.
export async function saveClassRemarks(classId, fd) {
  const user = await requireUser('TEACHER');
  const cls = await assertTeacherClass(user, classId);
  if (!cls) return fail('You are not assigned to this class.');
  const { term } = await getCurrent();
  if (!term) return fail('No current term has been set by the administrator yet.');

  const students = await prisma.student.findMany({ where: { classId }, select: { id: true } });
  await prisma.$transaction(
    students.map((s) => {
      const v = str(fd, 'rem_' + s.id, 300) || null;
      return prisma.reportRemark.upsert({
        where: { studentId_termId: { studentId: s.id, termId: term.id } },
        create: { studentId: s.id, termId: term.id, classTeacherRemark: v },
        update: { classTeacherRemark: v },
      });
    })
  );
  await audit(user, 'REMARKS_SAVED', 'class', classId, `Class teacher remarks saved for ${cls.name}`);
  revalidatePath(`/teacher/classes/${classId}`);
  return ok('Remarks saved.');
}
