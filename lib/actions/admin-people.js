'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser, hashPassword, initialPassword } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { str, normKey, normAdmission, isEmail, isPhone, studentName, ok, fail } from '@/lib/utils';

const A = () => requireUser('ADMIN');
const SECTIONS = ['PRE_BASIC', 'BASIC', 'COLLEGE'];

// ------------------------------------------------------------------ STUDENTS
function readStudent(fd) {
  return {
    admissionNo: normAdmission(str(fd, 'admissionNo', 40)),
    surname: str(fd, 'surname', 60),
    firstName: str(fd, 'firstName', 60),
    otherNames: str(fd, 'otherNames', 80) || null,
    gender: str(fd, 'gender', 10),
    classId: str(fd, 'classId', 40),
    photoUrl: str(fd, 'photoUrl', 500) || null,
    portalEnabled: fd.get('portalEnabled') === 'on',
  };
}

function checkStudent(d) {
  if (!d.admissionNo) return 'Enter an admission number.';
  if (!d.surname) return 'Enter the student’s surname.';
  if (!d.firstName) return 'Enter the student’s first name.';
  if (!['Male', 'Female'].includes(d.gender)) return 'Select the student’s gender.';
  if (!d.classId) return 'Select a class.';
  return null;
}

export async function createStudent(fd) {
  const admin = await A();
  const d = readStudent(fd);
  const problem = checkStudent(d);
  if (problem) return fail(problem);
  const key = d.admissionNo.toLowerCase();
  if (await prisma.user.findUnique({ where: { usernameKey: key } })) {
    return fail(`The admission number ${d.admissionNo} is already in use.`);
  }
  if (!(await prisma.schoolClass.findUnique({ where: { id: d.classId } }))) return fail('That class does not exist.');

  const password = str(fd, 'password', 60) || d.surname;
  if (password.trim().length < 3) return fail('The initial password must be at least 3 characters.');

  const user = await prisma.user.create({
    data: {
      username: d.admissionNo,
      usernameKey: key,
      passwordHash: await hashPassword(initialPassword(password)),
      role: 'STUDENT',
      mustChangePassword: false,
      student: { create: d },
    },
    include: { student: true },
  });
  await audit(admin, 'STUDENT_CREATED', 'student', user.student.id, `${studentName(d)} (${d.admissionNo})`);
  revalidatePath('/admin', 'layout');
  redirect(`/admin/students/${user.student.id}?created=1`);
}

export async function updateStudent(id, fd) {
  const admin = await A();
  const d = readStudent(fd);
  const problem = checkStudent(d);
  if (problem) return fail(problem);
  const st = await prisma.student.findUnique({ where: { id } });
  if (!st) return fail('Student not found.');
  const key = d.admissionNo.toLowerCase();
  const clash = await prisma.user.findUnique({ where: { usernameKey: key } });
  if (clash && clash.id !== st.userId) return fail(`The admission number ${d.admissionNo} is already in use.`);

  await prisma.$transaction([
    prisma.user.update({ where: { id: st.userId }, data: { username: d.admissionNo, usernameKey: key } }),
    prisma.student.update({ where: { id }, data: d }),
  ]);
  await audit(admin, 'STUDENT_UPDATED', 'student', id, `${studentName(d)} (${d.admissionNo})`);
  revalidatePath('/admin', 'layout');
  return ok('Student details saved.');
}

// Switches a student's portal ON or OFF. Enforced on every request by the server.
export async function setPortalAccess(id, enabled) {
  const admin = await A();
  const st = await prisma.student.update({ where: { id }, data: { portalEnabled: !!enabled } }).catch(() => null);
  if (!st) return fail('Student not found.');
  await audit(admin, enabled ? 'PORTAL_ON' : 'PORTAL_OFF', 'student', id, `${studentName(st)} (${st.admissionNo})`);
  revalidatePath('/admin', 'layout');
  return ok(enabled ? 'Portal access is now ON.' : 'Portal access is now OFF.');
}

export async function resetStudentPassword(id, fd) {
  const admin = await A();
  const st = await prisma.student.findUnique({ where: { id } });
  if (!st) return fail('Student not found.');
  const pw = (fd && str(fd, 'password', 60)) || st.surname;
  if (pw.trim().length < 3) return fail('The password must be at least 3 characters.');
  await prisma.user.update({
    where: { id: st.userId },
    data: { passwordHash: await hashPassword(initialPassword(pw)), mustChangePassword: false, tokenVersion: { increment: 1 } },
  });
  await audit(admin, 'PASSWORD_RESET', 'student', id, `${st.admissionNo}`);
  return ok(`Password reset. The student can now log in with: ${pw}`);
}

export async function setStudentActive(id, active) {
  const admin = await A();
  const st = await prisma.student.findUnique({ where: { id } });
  if (!st) return fail('Student not found.');
  await prisma.user.update({ where: { id: st.userId }, data: { active: !!active } });
  await audit(admin, active ? 'STUDENT_ACTIVATED' : 'STUDENT_DEACTIVATED', 'student', id, st.admissionNo);
  revalidatePath('/admin', 'layout');
  return ok(active ? 'Student reactivated.' : 'Student deactivated.');
}

export async function deleteStudent(id) {
  const admin = await A();
  const st = await prisma.student.findUnique({ where: { id }, include: { _count: { select: { results: true } } } });
  if (!st) return fail('Student not found.');
  if (st._count.results > 0) return fail('This student has saved results. Deactivate the student instead of deleting, so academic records are kept.');
  await prisma.user.delete({ where: { id: st.userId } });
  await audit(admin, 'STUDENT_DELETED', 'student', id, `${studentName(st)} (${st.admissionNo})`);
  revalidatePath('/admin', 'layout');
  redirect('/admin/students');
}

// ------------------------------------------------------------------ TEACHERS
export async function createTeacher(fd) {
  const admin = await A();
  const fullName = str(fd, 'fullName', 100);
  const displayName = str(fd, 'displayName', 100) || fullName;
  const username = str(fd, 'username', 60);
  const password = String(fd.get('password') || '');
  const phone = str(fd, 'phone', 25) || null;
  const email = str(fd, 'email', 120).toLowerCase() || null;
  const classIds = fd.getAll('classIds').map(String);

  if (fullName.length < 2) return fail('Enter the teacher’s full name.');
  if (username.length < 2) return fail('Enter a login name for the teacher.');
  if (password.length < 6) return fail('The password must be at least 6 characters.');
  if (email && !isEmail(email)) return fail('Enter a valid email address or leave it empty.');
  if (await prisma.user.findUnique({ where: { usernameKey: normKey(username) } })) {
    return fail(`The login name "${username}" is already taken. Add a number or initial to make it unique.`);
  }

  const user = await prisma.user.create({
    data: {
      username, usernameKey: normKey(username), passwordHash: await hashPassword(password),
      role: 'TEACHER', mustChangePassword: true,
      teacher: { create: { fullName, displayName, phone, email, assignments: { create: classIds.map((classId) => ({ classId })) } } },
    },
    include: { teacher: true },
  });
  await audit(admin, 'TEACHER_CREATED', 'teacher', user.teacher.id, `${displayName} (${username})`);
  revalidatePath('/admin', 'layout');
  redirect(`/admin/teachers/${user.teacher.id}?created=1`);
}

export async function updateTeacher(id, fd) {
  const admin = await A();
  const t = await prisma.teacher.findUnique({ where: { id } });
  if (!t) return fail('Teacher not found.');
  const fullName = str(fd, 'fullName', 100);
  const displayName = str(fd, 'displayName', 100) || fullName;
  const username = str(fd, 'username', 60);
  const phone = str(fd, 'phone', 25) || null;
  const email = str(fd, 'email', 120).toLowerCase() || null;
  const active = fd.get('active') === 'on';
  const classIds = fd.getAll('classIds').map(String);

  if (fullName.length < 2) return fail('Enter the teacher’s full name.');
  if (username.length < 2) return fail('Enter a login name for the teacher.');
  if (email && !isEmail(email)) return fail('Enter a valid email address or leave it empty.');
  const clash = await prisma.user.findUnique({ where: { usernameKey: normKey(username) } });
  if (clash && clash.id !== t.userId) return fail(`The login name "${username}" is already taken.`);

  await prisma.$transaction([
    prisma.user.update({ where: { id: t.userId }, data: { username, usernameKey: normKey(username), active } }),
    prisma.teacher.update({ where: { id }, data: { fullName, displayName, phone, email } }),
    prisma.teacherClass.deleteMany({ where: { teacherId: id, classId: { notIn: classIds } } }),
    prisma.teacherClass.createMany({ data: classIds.map((classId) => ({ teacherId: id, classId })), skipDuplicates: true }),
  ]);
  await audit(admin, 'TEACHER_UPDATED', 'teacher', id, `${displayName} (${username})`);
  revalidatePath('/admin', 'layout');
  revalidatePath('/teacher', 'layout');
  return ok('Teacher details saved.');
}

export async function resetTeacherPassword(id, fd) {
  const admin = await A();
  const t = await prisma.teacher.findUnique({ where: { id } });
  if (!t) return fail('Teacher not found.');
  const password = String(fd.get('password') || '');
  if (password.length < 6) return fail('The password must be at least 6 characters.');
  await prisma.user.update({
    where: { id: t.userId },
    data: { passwordHash: await hashPassword(password), mustChangePassword: true, tokenVersion: { increment: 1 } },
  });
  await audit(admin, 'PASSWORD_RESET', 'teacher', id, t.displayName);
  return ok('Password reset. The teacher will be asked to choose a new one at next login.');
}

export async function deleteTeacher(id) {
  const admin = await A();
  const t = await prisma.teacher.findUnique({ where: { id }, include: { _count: { select: { submissions: true } } } });
  if (!t) return fail('Teacher not found.');
  if (t._count.submissions > 0) return fail('This teacher has result submissions on record. Deactivate the account instead of deleting it.');
  await prisma.user.delete({ where: { id: t.userId } });
  await audit(admin, 'TEACHER_DELETED', 'teacher', id, t.displayName);
  revalidatePath('/admin', 'layout');
  redirect('/admin/teachers');
}

// ------------------------------------------------------------------- CLASSES
export async function saveClass(id, fd) {
  const admin = await A();
  const name = str(fd, 'name', 40);
  const section = str(fd, 'section', 20);
  const sortOrder = parseInt(str(fd, 'sortOrder', 5), 10) || 0;
  if (name.length < 2) return fail('Enter a class name.');
  if (!SECTIONS.includes(section)) return fail('Select a school section.');
  const clash = await prisma.schoolClass.findUnique({ where: { name } });
  if (clash && clash.id !== id) return fail(`A class named "${name}" already exists.`);

  if (id === 'new') {
    const c = await prisma.schoolClass.create({ data: { name, section, sortOrder } });
    await audit(admin, 'CLASS_CREATED', 'class', c.id, name);
    revalidatePath('/admin', 'layout');
    redirect(`/admin/classes/${c.id}`);
  }
  await prisma.schoolClass.update({ where: { id }, data: { name, section, sortOrder } });
  await audit(admin, 'CLASS_UPDATED', 'class', id, name);
  revalidatePath('/admin', 'layout');
  return ok('Class saved.');
}

export async function deleteClass(id) {
  const admin = await A();
  const c = await prisma.schoolClass.findUnique({ where: { id }, include: { _count: { select: { students: true, submissions: true } } } });
  if (!c) return fail('Class not found.');
  if (c._count.students > 0) return fail('This class still has students. Move them to another class first.');
  if (c._count.submissions > 0) return fail('This class has result records and cannot be deleted.');
  await prisma.schoolClass.delete({ where: { id } });
  await audit(admin, 'CLASS_DELETED', 'class', id, c.name);
  revalidatePath('/admin', 'layout');
  redirect('/admin/classes');
}

export async function setClassTeachers(classId, fd) {
  const admin = await A();
  const ids = fd.getAll('teacherIds').map(String);
  await prisma.$transaction([
    prisma.teacherClass.deleteMany({ where: { classId, teacherId: { notIn: ids } } }),
    prisma.teacherClass.createMany({ data: ids.map((teacherId) => ({ teacherId, classId })), skipDuplicates: true }),
  ]);
  await audit(admin, 'CLASS_TEACHERS_SET', 'class', classId, `${ids.length} teacher(s) assigned`);
  revalidatePath('/admin', 'layout');
  revalidatePath('/teacher', 'layout');
  return ok('Teacher assignments saved.');
}

export async function setClassSubjects(classId, fd) {
  const admin = await A();
  const ids = fd.getAll('subjectIds').map(String);
  await prisma.$transaction([
    prisma.classSubject.deleteMany({ where: { classId, subjectId: { notIn: ids } } }),
    prisma.classSubject.createMany({ data: ids.map((subjectId) => ({ subjectId, classId })), skipDuplicates: true }),
  ]);
  await audit(admin, 'CLASS_SUBJECTS_SET', 'class', classId, `${ids.length} subject(s)`);
  revalidatePath('/admin', 'layout');
  revalidatePath('/teacher', 'layout');
  return ok('Subjects saved.');
}

// Move students into this class by admission number.
export async function addStudentsToClass(classId, fd) {
  const admin = await A();
  const nums = str(fd, 'admissionNos', 3000).split(/[\s,;]+/).map(normAdmission).filter(Boolean);
  if (!nums.length) return fail('Enter at least one admission number.');
  const found = await prisma.student.findMany({ where: { admissionNo: { in: nums } }, select: { admissionNo: true } });
  const missing = nums.filter((n) => !found.some((f) => f.admissionNo === n));
  await prisma.student.updateMany({ where: { admissionNo: { in: nums } }, data: { classId } });
  await audit(admin, 'STUDENTS_MOVED', 'class', classId, `${found.length} student(s) moved in`);
  revalidatePath('/admin', 'layout');
  return missing.length
    ? ok(`${found.length} moved. Not found: ${missing.join(', ')}`)
    : ok(`${found.length} student(s) moved into this class.`);
}