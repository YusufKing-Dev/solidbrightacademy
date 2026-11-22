import { PrismaClient } from '@prisma/client';

const g = globalThis;
export const prisma = g.__sbaPrisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.__sbaPrisma = prisma;
