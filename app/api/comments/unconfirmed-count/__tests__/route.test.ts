import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from '../route';
import * as authMiddleware from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import type { SessionData } from '@/types/session';

// Mock dependencies
vi.mock('@/lib/middleware/auth');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    comment: {
      count: vi.fn(),
    },
  },
}));

describe('GET /api/comments/unconfirmed-count', () => {
  const mockSession: SessionData = {
    salesId: 'test-sales-id-123',
    salesCode: 'S001',
    salesName: '山田太郎',
    email: 'yamada@example.com',
    department: '営業1課',
    isManager: false,
    expiresAt: Date.now() + 30 * 60 * 1000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('認証されたユーザーの未確認コメント数を返す', async () => {
    // Arrange
    vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
      session: mockSession,
      error: null,
    });
    vi.mocked(prisma.comment.count).mockResolvedValue(5);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: 'success',
      data: {
        count: 5,
      },
    });

    // Prismaのcount関数が正しいパラメータで呼ばれることを確認
    expect(prisma.comment.count).toHaveBeenCalledWith({
      where: {
        dailyReport: {
          salesId: mockSession.salesId,
        },
        commenterId: {
          not: mockSession.salesId,
        },
        isRead: false,
      },
    });
  });

  it('未確認コメントが0件の場合、0を返す', async () => {
    // Arrange
    vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
      session: mockSession,
      error: null,
    });
    vi.mocked(prisma.comment.count).mockResolvedValue(0);

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: 'success',
      data: {
        count: 0,
      },
    });
  });

  it('認証されていない場合、401エラーを返す', async () => {
    // Arrange
    const mockErrorResponse = NextResponse.json(
      {
        status: 'error',
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: '認証が必要です',
        },
      },
      { status: 401 }
    );

    vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
      session: null,
      error: true,
      response: mockErrorResponse,
    });

    // Act
    const response = await GET();

    // Assert
    expect(response.status).toBe(401);
  });

  it('データベースエラー時、500エラーを返す', async () => {
    // Arrange
    vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
      session: mockSession,
      error: null,
    });
    vi.mocked(prisma.comment.count).mockRejectedValue(new Error('Database connection error'));

    // Act
    const response = await GET();
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({
      status: 'error',
      error: {
        code: 'SERVER_ERROR',
        message: 'コメント数の取得に失敗しました',
      },
    });
  });

  it('自分自身のコメントは除外される', async () => {
    // Arrange
    vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
      session: mockSession,
      error: null,
    });
    vi.mocked(prisma.comment.count).mockResolvedValue(3);

    // Act
    await GET();

    // Assert
    // commenterId.notで自分のIDが除外されていることを確認
    const countCall = vi.mocked(prisma.comment.count).mock.calls[0][0];
    expect(countCall?.where?.commenterId).toEqual({
      not: mockSession.salesId,
    });
  });
});
