'use server';

import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { sendEmail } from '@/lib/email';
import { esc, str, getIpHash, isEmail, isPhone, ok, fail, fmtDate } from '@/lib/utils';

function botCheck(fd) {
  if (str(fd, 'website', 100)) return true; // honeypot filled
  const ts = Number(fd.get('ts'));
  if (!ts || Date.now() - ts < 2500) return true; // submitted too fast
  return false;
}

export async function submitApplication(fd) {
  if (botCheck(fd)) return fail('Please wait a moment and try again.');

  const applicantName = str(fd, 'applicantName', 120);
  const gender = str(fd, 'gender', 10);
  const dobRaw = str(fd, 'dob', 20);
  const guardianName = str(fd, 'guardianName', 120);
  const guardianPhone = str(fd, 'guardianPhone', 25);
  const guardianEmail = str(fd, 'guardianEmail', 120).toLowerCase();
  const address = str(fd, 'address', 300);
  const classApplying = str(fd, 'classApplying', 40);
  const previousSchool = str(fd, 'previousSchool', 150);
  const notes = str(fd, 'notes', 1000);

  if (applicantName.length < 3) return fail('Enter the applicant’s full name.');
  if (!['Male', 'Female'].includes(gender)) return fail('Select the applicant’s gender.');
  const dob = new Date(dobRaw);
  const years = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (!dobRaw || Number.isNaN(dob.getTime()) || years < 1 || years > 25) return fail('Enter a valid date of birth.');
  if (guardianName.length < 3) return fail('Enter the parent or guardian’s full name.');
  if (!isPhone(guardianPhone)) return fail('Enter a valid parent or guardian phone number.');
  if (!isEmail(guardianEmail)) return fail('Enter a valid parent or guardian email address.');
  if (address.length < 5) return fail('Enter the residential address.');

  const cls = await prisma.schoolClass.findUnique({ where: { name: classApplying } });
  if (!cls) return fail('Select the class the applicant is applying for.');

  const ipHash = getIpHash();
  const recent = await prisma.application.count({
    where: { ipHash, createdAt: { gte: new Date(Date.now() - 3600 * 1000) } },
  });
  if (recent >= 5) return fail('Too many applications were sent from this connection. Please try again later.');

  const dup = await prisma.application.findFirst({
    where: {
      applicantName: { equals: applicantName, mode: 'insensitive' },
      guardianPhone,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
    },
  });
  if (dup) return fail('We have already received an application for this applicant. The school will contact you.');

  // 1) Save first. The application is never lost, even if email fails.
  const app = await prisma.application.create({
    data: {
      applicantName, gender, dob, guardianName, guardianPhone, guardianEmail, address,
      classApplying, previousSchool: previousSchool || null, notes: notes || null, ipHash,
    },
  });

  // 2) Then try to email the school.
  try {
    const s = await getSettings();
    const html = `<h2>New admission application</h2>
      <p><b>Applicant:</b> ${esc(applicantName)}<br><b>Date of birth:</b> ${esc(fmtDate(dob))}<br><b>Gender:</b> ${esc(gender)}<br>
      <b>Class applying for:</b> ${esc(classApplying)}<br><b>Previous school:</b> ${esc(previousSchool || '-')}</p>
      <p><b>Parent/guardian:</b> ${esc(guardianName)}<br><b>Phone:</b> ${esc(guardianPhone)}<br><b>Email:</b> ${esc(guardianEmail)}<br><b>Address:</b> ${esc(address)}</p>
      <p><b>Additional information:</b> ${esc(notes || '-')}</p>
      <p>Open the admin dashboard, then Applications, to review it.</p>`;
    const r = await sendEmail({ to: s.notificationEmail, subject: `New admission application: ${applicantName}`, html, replyTo: guardianEmail });
    await prisma.application.update({
      where: { id: app.id },
      data: { emailSent: r.ok, emailError: r.ok ? null : r.error },
    });
  } catch (e) {
    await prisma.application.update({ where: { id: app.id }, data: { emailSent: false, emailError: String(e.message || e).slice(0, 300) } }).catch(() => {});
  }

  return ok('Thank you. Your application has been received. The school will contact you on the phone number or email you provided.');
}

export async function submitContact(fd) {
  if (botCheck(fd)) return fail('Please wait a moment and try again.');
  const name = str(fd, 'name', 100);
  const email = str(fd, 'email', 120).toLowerCase();
  const phone = str(fd, 'phone', 25);
  const subject = str(fd, 'subject', 150);
  const message = str(fd, 'message', 3000);

  if (name.length < 2) return fail('Enter your name.');
  if (!isEmail(email)) return fail('Enter a valid email address.');
  if (phone && !isPhone(phone)) return fail('Enter a valid phone number or leave it empty.');
  if (message.length < 10) return fail('Write a message of at least 10 characters.');

  const ipHash = getIpHash();
  const recent = await prisma.contactMessage.count({ where: { ipHash, createdAt: { gte: new Date(Date.now() - 3600 * 1000) } } });
  if (recent >= 5) return fail('Too many messages were sent from this connection. Please try again later.');

  await prisma.contactMessage.create({ data: { name, email, phone: phone || null, subject: subject || null, message, ipHash } });

  try {
    const s = await getSettings();
    await sendEmail({
      to: s.notificationEmail,
      subject: `Website message: ${subject || name}`,
      replyTo: email,
      html: `<h2>New website message</h2><p><b>From:</b> ${esc(name)} (${esc(email)}${phone ? ', ' + esc(phone) : ''})</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`,
    });
  } catch (e) { /* message is already saved */ }

  return ok('Thank you. Your message has been sent. We will reply as soon as we can.');
}
