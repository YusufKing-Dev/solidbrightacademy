import { prisma } from './db';
import { gradeFor } from './academic';
import { studentName } from './utils';

// Reads CA / exam scores for each student from a submitted form, validates them
// against the limits set by the administrator and calculates totals and grades.
export function parseScoreRows(fd, students, limits, bands) {
  const rows = [];
  for (const st of students) {
    const rawCa = String(fd.get('ca_' + st.id) ?? '').trim();
    const rawEx = String(fd.get('exam_' + st.id) ?? '').trim();
    const teacherRemark = String(fd.get('rm_' + st.id) ?? '').trim().slice(0, 120);
    const parse = (raw, max, label) => {
      if (raw === '') return { v: null };
      const v = Number(raw);
      if (!Number.isFinite(v) || v < 0 || v > max) {
        return { err: `${studentName(st)}: the ${label} score must be a number from 0 to ${max}.` };
      }
      return { v: Math.round(v * 10) / 10 };
    };
    const a = parse(rawCa, limits.maxCA, 'continuous assessment');
    const b = parse(rawEx, limits.maxExam, 'exam');
    if (a.err || b.err) return { error: a.err || b.err };
    const total = a.v != null && b.v != null ? Math.round((a.v + b.v) * 10) / 10 : null;
    const g = total != null ? gradeFor(total, bands) : { grade: null, remark: null };
    rows.push({
      studentId: st.id, name: studentName(st), ca: a.v, exam: b.v, total,
      grade: g.grade, remark: g.remark, teacherRemark: teacherRemark || null,
    });
  }
  return { rows };
}

export function checkSubmittable(rows) {
  const half = rows.find((r) => (r.ca == null) !== (r.exam == null));
  if (half) return `Enter both the CA and exam scores for ${half.name}, or leave both empty.`;
  if (!rows.some((r) => r.total != null)) return 'Enter scores for at least one student before submitting.';
  return null;
}

export async function writeRows(submissionId, rows) {
  await prisma.$transaction(
    rows.map((r) =>
      prisma.result.upsert({
        where: { submissionId_studentId: { submissionId, studentId: r.studentId } },
        create: { submissionId, studentId: r.studentId, ca: r.ca, exam: r.exam, total: r.total, grade: r.grade, remark: r.remark, teacherRemark: r.teacherRemark },
        update: { ca: r.ca, exam: r.exam, total: r.total, grade: r.grade, remark: r.remark, teacherRemark: r.teacherRemark },
      })
    )
  );
}
