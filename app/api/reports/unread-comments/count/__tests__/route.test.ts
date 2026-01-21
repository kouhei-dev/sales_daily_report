/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// vi.hoisted を使ってモック関数を定義
const mockCommentCount = vi.hoisted(() => vi.fn());
const mockDisconnect = vi.hoisted(() => vi.fn());

// モックの設定
vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    comment = {
      count: mockCommentCount,
    };
    $disconnect = mockDisconnect;
  }

  return {
    PrismaClient: MockPrismaClient,
  };
});

vi.mock('@/lib/middleware/auth', () => ({
  requireAuth: vi.fn(),
}));

// テスト用のヘルパー関数
const mockAuth = async () => {
  const { requireAuth } = await import('@/lib/middleware/auth');
  vi.mocked(requireAuth).mockResolvedValue({
    session: {
      salesId: '507f1f77bcf86cd799439012',
      salesCode: 'S001',
      salesName: '佐藤花子',
      email: 'sato@example.com',
      department: '営業1課',
      isManager: false,
      expiresAt: Date.now() + 30 * 60 * 1000,
    },
    error: null,
  } as any);
};

const mockUnauthorized = async () => {
  const { requireAuth } = await import('@/lib/middleware/auth');
  const errorResponse = {
    status: 'error',
    error: {
      code: 'AUTH_UNAUTHORIZED',
      message: '認証が必要です',
    },
  };

  vi.mocked(requireAuth).mockResolvedValue({
    session: null,
    error: true,
    response: {
      json: () => Promise.resolve(errorResponse),
      status: 401,
    } as any,
  });
};

describe('GET /api/reports/unread-comments/count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未読コメント数を取得できる', async () => {
    await mockAuth();

    mockCommentCount.mockResolvedValue(5);

    const request = new NextRequest('http://localhost/api/reports/unread-comments/count');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.unread_count).toBe(5);
    expect(mockCommentCount).toHaveBeenCalledWith({
      where: {
        dailyReport: {
          salesId: '507f1f77bcf86cd799439012',
        },
        isRead: false,
      },
    });
  });

  it('未読コメントが0件の場合', async () => {
    await mockAuth();

    mockCommentCount.mockResolvedValue(0);

    const request = new NextRequest('http://localhost/api/reports/unread-comments/count');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.unread_count).toBe(0);
  });

  it('未認証の場合は401エラー', async () => {
    await mockUnauthorized();

    const request = new NextRequest('http://localhost/api/reports/unread-comments/count');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('AUTH_UNAUTHORIZED');
  });
});
