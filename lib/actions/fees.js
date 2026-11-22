import { prisma } from '@/lib/db';
import { getCurrent } from '@/lib/academic';
import { RESTRICTED_MESSAGE } from '@/lib/utils';

export const naira = (n) => '₦' + Number(n).toLocaleString('en-NG');

// Message shown to a student whose portal is switched off.
// Includes the fee for their class and the current term, if the admin has set one.
export async function restrictedMessage(classId) {
  try {
    const { session, term, termName } = await getCurrent();
    if (!term || !classId) return RESTRICTED_MESSAGE;
    const fee = await prisma.classFee.findUnique({
      where: { classId_termId: { classId, termId: term.id } },
      include: { class: true },
    });
    if (!fee) return RESTRICTED_MESSAGE;
    return `Your portal access is currently restricted. The school fees for ${fee.class.name}, ${termName} (${session.name}) is ${naira(fee.amount)}. Please contact the school administration regarding payment.`;
  } catch {
    return RESTRICTED_MESSAGE;
  }
}