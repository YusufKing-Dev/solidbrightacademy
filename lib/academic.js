import { cache } from 'react';
import { prisma } from './db';
import { getSettings } from './settings';
import { TERM_NAMES } from './utils';

export const getCurrent = cache(async () => {
  const session = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
  const term = session
    ? await prisma.term.findFirst({ where: { sessionId: session.id, isCurrent: true } })
    : null;
  return { session, term, termName: term ? TERM_NAMES[term.number] : null };
});

export const getGradeBands = cache(async () =>
  prisma.gradeBand.findMany({ orderBy: { minScore: 'desc' } })
);

export async function getScoreLimits() {
  const s = await getSettings();
  const maxCA = Number(s.maxCA) || 40;
  const maxExam = Number(s.maxExam) || 60;
  return { maxCA, maxExam, maxTotal: maxCA + maxExam };
}

export function gradeFor(total, bands) {
  if (total == null || Number.isNaN(total)) return { grade: null, remark: null };
  const t = Math.round(total);
  const b = bands.find((x) => t >= x.minScore && t <= x.maxScore);
  return b ? { grade: b.grade, remark: b.remark } : { grade: null, remark: null };
}
