import { PrismaClient } from '@prisma/client';

// PrismaClientのグローバル型定義
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prismaクライアントのシングルトンインスタンス
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// 開発環境では、ホットリロード時に複数のインスタンスが作成されないようにする
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
