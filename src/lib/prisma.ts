/**
 * Prisma 客户端单例
 *
 * 为什么需要单例？
 * 在开发模式下，Astro 的热更新会频繁重新加载模块。
 * 如果不做单例，每次热更新都会 new PrismaClient()，
 * 很快就会耗尽数据库连接。全局变量 `globalThis` 在热更新中保持不变。
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
