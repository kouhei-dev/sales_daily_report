/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// vi.hoisted を使ってモック関数を定義
const mockSalesFindMany = vi.hoisted(() => vi.fn());
const mockSalesCount = vi.hoisted(() => vi.fn());
const mockSalesFindUnique = vi.hoisted(() => vi.fn());
const mockSalesCreate = vi.hoisted(() => vi.fn());
const mockDisconnect = vi.hoisted(() => vi.fn());

// モックの設定
vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    sales = {
      findMany: mockSalesFindMany,
      count: mockSalesCount,
      findUnique: mockSalesFindUnique,
      create: mockSalesCreate,
    };
    $disconnect = mockDisconnect;
  }

  return {
    PrismaClient: MockPrismaClient,
  };
});

vi.mock('@/lib/middleware/auth', () => ({
  requireManager: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  hashPassword: vi.fn(),
}));

// テスト用のヘルパー関数
const mockManagerAuth = async () => {
  const { requireManager } = await import('@/lib/middleware/auth');
  vi.mocked(requireManager).mockResolvedValue({
    session: {
      salesId: 'manager-id-1',
      salesCode: 'M001',
      salesName: '山田太郎',
      email: 'yamada@example.com',
      department: '営業部',
      isManager: true,
      expiresAt: Date.now() + 30 * 60 * 1000,
    },
    error: null,
  } as any);
};

const mockNonManagerAuth = async () => {
  const { requireManager } = await import('@/lib/middleware/auth');
  const errorResponse = {
    status: 'error',
    error: {
      code: 'AUTH_FORBIDDEN',
      message: '権限がありません',
    },
  };

  vi.mocked(requireManager).mockResolvedValue({
    session: null,
    error: true,
    response: {
      json: () => Promise.resolve(errorResponse),
      status: 403,
    } as any,
  });
};

describe('GET /api/sales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('管理者は営業一覧を取得できる', async () => {
    await mockManagerAuth();

    mockSalesCount.mockResolvedValue(2);
    mockSalesFindMany.mockResolvedValue([
      {
        id: 'sales-id-1',
        salesCode: 'S001',
        salesName: '佐藤花子',
        email: 'sato@example.com',
        department: '営業1課',
        managerId: 'manager-id-1',
        isManager: false,
        createdAt: new Date('2025-12-01T10:00:00Z'),
        updatedAt: new Date('2026-01-10T15:00:00Z'),
        manager: {
          id: 'manager-id-1',
          salesName: '山田太郎',
        },
      },
      {
        id: 'sales-id-2',
        salesCode: 'S002',
        salesName: '鈴木一郎',
        email: 'suzuki@example.com',
        department: '営業2課',
        managerId: null,
        isManager: false,
        createdAt: new Date('2025-12-05T10:00:00Z'),
        updatedAt: new Date('2026-01-12T15:00:00Z'),
        manager: null,
      },
    ]);

    const request = new NextRequest('http://localhost/api/sales?page=1&limit=20');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.items).toHaveLength(2);
    expect(data.data.items[0].sales_code).toBe('S001');
    expect(data.data.items[0].manager.sales_name).toBe('山田太郎');
    expect(data.data.pagination.total_items).toBe(2);
    expect(data.data.pagination.current_page).toBe(1);
  });

  it('クエリパラメータでフィルタリングできる', async () => {
    await mockManagerAuth();

    mockSalesCount.mockResolvedValue(1);
    mockSalesFindMany.mockResolvedValue([
      {
        id: 'sales-id-1',
        salesCode: 'S001',
        salesName: '佐藤花子',
        email: 'sato@example.com',
        department: '営業1課',
        managerId: null,
        isManager: false,
        createdAt: new Date('2025-12-01T10:00:00Z'),
        updatedAt: new Date('2026-01-10T15:00:00Z'),
        manager: null,
      },
    ]);

    const request = new NextRequest(
      'http://localhost/api/sales?sales_name=佐藤&department=営業1課'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.items).toHaveLength(1);
    expect(mockSalesFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          salesName: { contains: '佐藤', mode: 'insensitive' },
          department: '営業1課',
        }),
      })
    );
  });

  it('管理者以外はアクセス拒否される', async () => {
    await mockNonManagerAuth();

    const request = new NextRequest('http://localhost/api/sales');

    const response = await GET(request);

    expect(response.status).toBe(403);
  });

  it('無効なページ番号の場合、バリデーションエラーを返す', async () => {
    await mockManagerAuth();

    const request = new NextRequest('http://localhost/api/sales?page=0');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/sales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('管理者は営業を作成できる', async () => {
    await mockManagerAuth();
    const { hashPassword } = await import('@/lib/auth');

    const validManagerId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId

    // 営業コードとメールアドレスが重複していない
    mockSalesFindUnique.mockResolvedValueOnce(null);
    mockSalesFindUnique.mockResolvedValueOnce(null);
    // 上司が存在して、管理者である
    mockSalesFindUnique.mockResolvedValueOnce({
      id: validManagerId,
      salesCode: 'M001',
      salesName: '山田太郎',
      isManager: true,
    } as any);

    vi.mocked(hashPassword).mockResolvedValue('$2a$10$hashedpassword');

    mockSalesCreate.mockResolvedValue({
      id: 'new-sales-id',
      salesCode: 'S999',
      salesName: 'テスト太郎',
      email: 'test@example.com',
      passwordHash: '$2a$10$hashedpassword',
      department: '営業1課',
      managerId: validManagerId,
      isManager: false,
      createdAt: new Date('2026-01-18T10:00:00Z'),
      updatedAt: new Date('2026-01-18T10:00:00Z'),
    });

    const request = new NextRequest('http://localhost/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        sales_code: 'S999',
        sales_name: 'テスト太郎',
        email: 'test@example.com',
        password: 'Test1234!@',
        department: '営業1課',
        manager_id: validManagerId,
        is_manager: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.status).toBe('success');
    expect(data.data.sales_code).toBe('S999');
    expect(data.data.sales_name).toBe('テスト太郎');
    expect(mockSalesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          salesCode: 'S999',
          salesName: 'テスト太郎',
          email: 'test@example.com',
        }),
      })
    );
  });

  it('営業コードが重複している場合、409エラーを返す', async () => {
    await mockManagerAuth();

    // 営業コードが重複
    mockSalesFindUnique.mockResolvedValueOnce({
      id: 'existing-id',
      salesCode: 'S999',
    } as any);

    const request = new NextRequest('http://localhost/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        sales_code: 'S999',
        sales_name: 'テスト太郎',
        email: 'test@example.com',
        password: 'Test1234!@',
        department: '営業1課',
        is_manager: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_CONFLICT');
    expect(data.error.message).toContain('営業コード');
  });

  it('メールアドレスが重複している場合、409エラーを返す', async () => {
    await mockManagerAuth();

    // 営業コードは重複していない
    mockSalesFindUnique.mockResolvedValueOnce(null);
    // メールアドレスが重複
    mockSalesFindUnique.mockResolvedValueOnce({
      id: 'existing-id',
      email: 'test@example.com',
    } as any);

    const request = new NextRequest('http://localhost/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        sales_code: 'S999',
        sales_name: 'テスト太郎',
        email: 'test@example.com',
        password: 'Test1234!@',
        department: '営業1課',
        is_manager: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_CONFLICT');
    expect(data.error.message).toContain('メールアドレス');
  });

  it('パスワードが要件を満たさない場合、バリデーションエラーを返す', async () => {
    await mockManagerAuth();

    const request = new NextRequest('http://localhost/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        sales_code: 'S999',
        sales_name: 'テスト太郎',
        email: 'test@example.com',
        password: 'weak', // 弱いパスワード
        department: '営業1課',
        is_manager: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('必須フィールドが欠けている場合、バリデーションエラーを返す', async () => {
    await mockManagerAuth();

    const request = new NextRequest('http://localhost/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        sales_code: 'S999',
        // sales_nameが欠けている
        email: 'test@example.com',
        password: 'Test1234!@',
        department: '営業1課',
        is_manager: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('存在しない上司IDを指定した場合、エラーを返す', async () => {
    await mockManagerAuth();

    // 営業コードとメールアドレスは重複していない
    mockSalesFindUnique.mockResolvedValueOnce(null);
    mockSalesFindUnique.mockResolvedValueOnce(null);
    // 上司が存在しない
    mockSalesFindUnique.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        sales_code: 'S999',
        sales_name: 'テスト太郎',
        email: 'test@example.com',
        password: 'Test1234!@',
        department: '営業1課',
        manager_id: '123456789012345678901234',
        is_manager: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'manager_id',
          message: '指定された上司が見つかりません',
        }),
      ])
    );
  });

  it('管理者ではない営業を上司に指定した場合、エラーを返す', async () => {
    await mockManagerAuth();

    // 営業コードとメールアドレスは重複していない
    mockSalesFindUnique.mockResolvedValueOnce(null);
    mockSalesFindUnique.mockResolvedValueOnce(null);
    // 上司は存在するが、管理者ではない
    mockSalesFindUnique.mockResolvedValueOnce({
      id: '123456789012345678901234',
      salesCode: 'S001',
      salesName: '佐藤花子',
      isManager: false, // 管理者ではない
    } as any);

    const request = new NextRequest('http://localhost/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        sales_code: 'S999',
        sales_name: 'テスト太郎',
        email: 'test@example.com',
        password: 'Test1234!@',
        department: '営業1課',
        manager_id: '123456789012345678901234',
        is_manager: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'manager_id',
          message: '指定された営業は管理者ではありません',
        }),
      ])
    );
  });
});
