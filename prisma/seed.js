/* Sets up the starting data. Safe to run more than once: it never overwrites
   anything that already exists.  Run with:  npm run db:seed  */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load .env without needing an extra package
try {
  const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (e) { /* no .env file, use real environment */ }

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const normKey = (s) => String(s).trim().toLowerCase().replace(/\s+/g, ' ');

const CLASSES = [
  ['KG', 'PRE_BASIC', 1],
  ['Basic 1', 'BASIC', 2], ['Basic 2', 'BASIC', 3], ['Basic 3', 'BASIC', 4], ['Basic 4', 'BASIC', 5], ['Basic 5', 'BASIC', 6],
  ['JSS 1', 'COLLEGE', 7], ['JSS 2', 'COLLEGE', 8], ['JSS 3', 'COLLEGE', 9],
  ['SS 1', 'COLLEGE', 10], ['SS 2', 'COLLEGE', 11], ['SS 3', 'COLLEGE', 12],
];

// Starter subjects. The administrator can add, rename and remove these.
const SUBJECTS = {
  PRE_BASIC: ['Number Work', 'Letter Work', 'Rhymes', 'Social Habits', 'Health Habits', 'Creative Arts'],
  BASIC: ['English Language', 'Mathematics', 'Basic Science and Technology', 'Social Studies', 'Civic Education', 'Christian Religious Studies', 'Islamic Religious Studies', 'Computer Studies', 'Cultural and Creative Arts', 'Physical and Health Education', 'Yoruba Language', 'Verbal Reasoning', 'Quantitative Reasoning'],
  JSS: ['English Language', 'Mathematics', 'Basic Science', 'Basic Technology', 'Social Studies', 'Civic Education', 'Christian Religious Studies', 'Islamic Religious Studies', 'Computer Studies', 'Business Studies', 'Agricultural Science', 'Home Economics', 'Cultural and Creative Arts', 'Physical and Health Education', 'Yoruba Language'],
  SS: ['English Language', 'Mathematics', 'Civic Education', 'Biology', 'Chemistry', 'Physics', 'Economics', 'Government', 'Literature in English', 'Geography', 'Agricultural Science', 'Financial Accounting', 'Commerce', 'Christian Religious Studies', 'Islamic Religious Studies', 'Computer Studies', 'Yoruba Language'],
};

const GRADES = [
  [70, 100, 'A', 'Excellent'], [60, 69, 'B', 'Very Good'], [50, 59, 'C', 'Good'],
  [45, 49, 'D', 'Fair'], [40, 44, 'E', 'Pass'], [0, 39, 'F', 'Fail'],
];

const TEACHERS = [
  ['Mrs. Oyinade', ['KG']],
  ['Mrs. Ishola', ['Basic 2', 'Basic 3']],
  ['Mrs. Blessing', ['Basic 4', 'Basic 5']],
  ['Mr. Ibrahim', ['JSS 1']],
  ['Mr. Ganiyu', ['JSS 2', 'JSS 3']],
  ['Miss Adenike', ['SS 1']],
  ['Mrs. Ojo', ['SS 3']],
];

const GALLERY = [
  ['/images/gallery-1.jpg', 'Pupils celebrating together outside Solid Bright Academy in Ilorin'],
  ['/images/gallery-5.jpg', 'The Solid Bright Academy school building and gate in Upper Gaa Akanbi, Ilorin'],
  ['/images/gallery-2.jpg', 'Pupils in class at Solid Bright Academy, Ilorin'],
  ['/images/gallery-4.jpg', 'Students writing an exam at Solid Bright Academy, Ilorin'],
  ['/images/gallery-3.jpg', 'Primary pupils working in a classroom at Solid Bright Academy'],
  ['/images/gallery-6.jpg', 'Students sitting a test at Solid Bright Academy, Ilorin'],
];

async function main() {
  const out = [];

  // classes
  for (const [name, section, sortOrder] of CLASSES) {
    await prisma.schoolClass.upsert({ where: { name }, update: {}, create: { name, section, sortOrder } });
  }
  const classes = await prisma.schoolClass.findMany();

  // subjects and which classes use them
  const subjectNames = [...new Set(Object.values(SUBJECTS).flat())];
  for (const name of subjectNames) await prisma.subject.upsert({ where: { name }, update: {}, create: { name } });
  const subjects = await prisma.subject.findMany();
  if ((await prisma.classSubject.count()) === 0) {
    for (const c of classes) {
      const list = c.section === 'PRE_BASIC' ? SUBJECTS.PRE_BASIC : c.section === 'BASIC' ? SUBJECTS.BASIC : c.name.startsWith('JSS') ? SUBJECTS.JSS : SUBJECTS.SS;
      const data = subjects.filter((s) => list.includes(s.name)).map((s) => ({ classId: c.id, subjectId: s.id }));
      await prisma.classSubject.createMany({ data, skipDuplicates: true });
    }
  }

  // grading
  if ((await prisma.gradeBand.count()) === 0) {
    await prisma.gradeBand.createMany({ data: GRADES.map(([minScore, maxScore, grade, remark]) => ({ minScore, maxScore, grade, remark })) });
  }
  for (const [key, value] of [['maxCA', '40'], ['maxExam', '60']]) {
    await prisma.siteSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // academic session: 2026/2027, 1st Term current (change it in the admin dashboard)
  if ((await prisma.academicSession.count()) === 0) {
    await prisma.academicSession.create({
      data: { name: '2026/2027', isCurrent: true, terms: { create: [1, 2, 3].map((n) => ({ number: n, isCurrent: n === 1 })) } },
    });
  }

  // administrator
  const adminName = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!(await prisma.user.findUnique({ where: { usernameKey: normKey(adminName) } }))) {
    if (!adminPass || adminPass.length < 8) {
      console.error('\nSet ADMIN_PASSWORD (at least 8 characters) in your .env file, then run the seed again.\n');
      process.exit(1);
    }
    await prisma.user.create({
      data: { username: adminName, usernameKey: normKey(adminName), passwordHash: await bcrypt.hash(adminPass, 10), role: 'ADMIN', mustChangePassword: false },
    });
    out.push(`Administrator created. Username: ${adminName}   Password: (the ADMIN_PASSWORD you set)`);
  } else {
    out.push('Administrator already exists. Left unchanged.');
  }

  // teachers (only the first time) with random first passwords shown ONCE
  if ((await prisma.teacher.count()) === 0) {
    for (const [name, classNames] of TEACHERS) {
      const password = crypto.randomBytes(4).toString('hex'); // 8 characters
      const user = await prisma.user.create({
        data: {
          username: name, usernameKey: normKey(name), passwordHash: await bcrypt.hash(password, 10), role: 'TEACHER', mustChangePassword: true,
          teacher: { create: { fullName: name, displayName: name } },
        },
        include: { teacher: true },
      });
      const ids = classes.filter((c) => classNames.includes(c.name)).map((c) => ({ teacherId: user.teacher.id, classId: c.id }));
      await prisma.teacherClass.createMany({ data: ids, skipDuplicates: true });
      out.push(`Teacher: ${name.padEnd(14)} password: ${password}   classes: ${classNames.join(', ')}`);
    }
    out.push('(Teacher passwords are shown only now. You can reset any of them in Admin > Teachers.)');
  }

  // gallery
  if ((await prisma.galleryImage.count()) === 0) {
    await prisma.galleryImage.createMany({ data: GALLERY.map(([url, caption], i) => ({ url, caption, sortOrder: i + 1 })) });
  }

  console.log('\n=== Setup finished ===\n' + out.join('\n') + '\n');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
