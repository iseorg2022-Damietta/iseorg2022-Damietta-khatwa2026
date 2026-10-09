import { PrismaClient } from "@prisma/client";
const g: any = global;
export const db: PrismaClient = g.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") g.__prisma = db;