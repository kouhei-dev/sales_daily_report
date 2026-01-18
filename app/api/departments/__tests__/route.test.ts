/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// vi.hoisted を使ってモック関数を定義
const mockDepartmentFindMany = vi.hoisted(() => vi.fn());
const mockDisconnect = vi.hoisted(() => vi.fn());

// モックの設定
vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    department = {
      findMany: mockDepartmentFindMany,
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
const mockAuthenticatedUser = async () => {
  const { requireAuth } = await import('@/lib/middleware/auth');
  vi.mocked(requireAuth).mockResolvedValue({
    session: {
      salesId: 'sales-id-1',
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

const mockUnauthenticatedUser = async () => {
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

describe('GET /api/departments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('認証済みユーザーは所属部署一覧を取得できる', async () => {
    await mockAuthenticatedUser();

    mockDepartmentFindMany.mockResolvedValue([
      {
        id: 'dept-id-1',
        departmentName: '営業1課',
        displayOrder: 1,
        createdAt: new Date('2025-12-01T10:00:00Z'),
        updatedAt: new Date('2026-01-10T15:00:00Z'),
      },
      {
        id: 'dept-id-2',
        departmentName: '営業2課',
        displayOrder: 2,
        createdAt: new Date('2025-12-01T10:00:00Z'),
        updatedAt: new Date('2026-01-10T15:00:00Z'),
      },
      {
        id: 'dept-id-3',
        departmentName: '営業3課',
        displayOrder: 3,
        createdAt: new Date('2025-12-01T10:00:00Z'),
        updatedAt: new Date('2026-01-10T15:00:00Z'),
      },
    ]);

    const request = new NextRequest('http://localhost/api/departments');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.departments).toHaveLength(3);
    expect(data.data.departments[0].department_id).toBe('dept-id-1');
    expect(data.data.departments[0].department_name).toBe('営業1課');
    expect(data.data.departments[0].display_order).toBe(1);
    expect(data.data.departments[1].department_name).toBe('営業2課');
    expect(data.data.departments[2].department_name).toBe('営業3課');
  });

  it('所属部署がdisplayOrderで昇順ソートされている', async () => {
    await mockAuthenticatedUser();

    mockDepartmentFindMany.mockResolvedValue([
      {
        id: 'dept-id-1',
        departmentName: '営業1課',
        displayOrder: 1,
        createdAt: new Date('2025-12-01T10:00:00Z'),
        updatedAt: new Date('2026-01-10T15:00:00Z'),
      },
      {
        id: 'dept-id-2',
        departmentName: '営業2課',
        displayOrder: 2,
        createdAt: new Date('2025-12-01T10:00:00Z'),
        updatedAt: new Date('2026-01-10T15:00:00Z'),
      },
      {
        id: 'dept-id-4',
        departmentName: '営業4課',
        displayOrder: 4,
        createdAt: new Date('2025-12-01T10:00:00Z'),
        updatedAt: new Date('2026-01-10T15:00:00Z'),
      },
      {
        id: 'dept-id-3',
        departmentName: '営業3課',
        displayOrder: 3,
        createdAt: new Date('2025-12-01T10:00:00Z'),
        updatedAt: new Date('2026-01-10T15:00:00Z'),
      },
    ]);

    const request = new NextRequest('http://localhost/api/departments');

    await GET(request);

    // findManyがorderByで呼ばれていることを確認
    expect(mockDepartmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          displayOrder: 'asc',
        },
      })
    );
  });

  it('空のリストも正しく返される', async () => {
    await mockAuthenticatedUser();

    mockDepartmentFindMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/departments');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.departments).toHaveLength(0);
    expect(Array.isArray(data.data.departments)).toBe(true);
  });

  it('未認証ユーザーは401エラーを返す', async () => {
    await mockUnauthenticatedUser();

    const request = new NextRequest('http://localhost/api/departments');

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('管理者も所属部署一覧を取得できる', async () => {
    const { requireAuth } = await import('@/lib/middleware/auth');
    vi.mocked(requireAuth).mockResolvedValue({
      session: {
        salesId: 'manager-id-1',
        salesCode: 'M001',
        salesName: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        isManager: true,
        expiresAt: Date.now() + 30 * 60 * 1000,
      },
      error: null,
    } as any);

    mockDepartmentFindMany.mockResolvedValue([
      {
        id: 'dept-id-1',
        departmentName: '営業1課',
        displayOrder: 1,
        createdAt: new Date('2025-12-01T10:00:00Z'),
        updatedAt: new Date('2026-01-10T15:00:00Z'),
      },
    ]);

    const request = new NextRequest('http://localhost/api/departments');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.departments).toHaveLength(1);
  });

  it('Prisma接続が常に切断される', async () => {
    await mockAuthenticatedUser();

    mockDepartmentFindMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/departments');

    await GET(request);

    // $disconnectが呼ばれていることを確認
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('データベースエラー時は500エラーを返す', async () => {
    await mockAuthenticatedUser();

    mockDepartmentFindMany.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/departments');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('SERVER_ERROR');
    expect(data.error.message).toBe('サーバーエラーが発生しました');
    // エラー時もPrisma接続が切断されることを確認
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
