/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';

// テスト用の有効なMongoDB ObjectID（24文字の16進数）
const VALID_SALES_ID = '507f1f77bcf86cd799439011';
const VALID_MANAGER_ID = '507f1f77bcf86cd799439012';
const VALID_NON_MANAGER_ID = '507f1f77bcf86cd799439013';
const OTHER_SALES_ID = '507f1f77bcf86cd799439014';

// vi.hoisted を使ってモック関数を定義
const mockSalesFindUnique = vi.hoisted(() => vi.fn());
const mockSalesUpdate = vi.hoisted(() => vi.fn());
const mockSalesDelete = vi.hoisted(() => vi.fn());
const mockDailyReportCount = vi.hoisted(() => vi.fn());
const mockCustomerCount = vi.hoisted(() => vi.fn());
const mockDisconnect = vi.hoisted(() => vi.fn());

// モックの設定
vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    sales = {
      findUnique: mockSalesFindUnique,
      update: mockSalesUpdate,
      delete: mockSalesDelete,
    };
    dailyReport = {
      count: mockDailyReportCount,
    };
    customer = {
      count: mockCustomerCount,
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
      salesId: VALID_MANAGER_ID,
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

const resetAllMocks = () => {
  vi.clearAllMocks();
  mockSalesFindUnique.mockReset();
  mockSalesUpdate.mockReset();
  mockSalesDelete.mockReset();
  mockDailyReportCount.mockReset();
  mockCustomerCount.mockReset();
};

describe('GET /api/sales/:id', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('管理者は営業詳細を取得できる', async () => {
    await mockManagerAuth();

    mockSalesFindUnique.mockResolvedValue({
      id: VALID_SALES_ID,
      salesCode: 'S001',
      salesName: '佐藤花子',
      email: 'sato@example.com',
      department: '営業1課',
      managerId: VALID_MANAGER_ID,
      isManager: false,
      createdAt: new Date('2025-12-01T10:00:00Z'),
      updatedAt: new Date('2026-01-10T15:00:00Z'),
      manager: {
        id: VALID_MANAGER_ID,
        salesName: '山田太郎',
      },
    });

    const request = new NextRequest(`http://localhost/api/sales/${VALID_SALES_ID}`);
    const params = Promise.resolve({ id: VALID_SALES_ID });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.sales_code).toBe('S001');
    expect(data.data.sales_name).toBe('佐藤花子');
    expect(data.data.manager.sales_name).toBe('山田太郎');
  });

  it('存在しない営業IDの場合、404エラーを返す', async () => {
    await mockManagerAuth();

    mockSalesFindUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/sales/123456789012345678901234');
    const params = Promise.resolve({ id: '123456789012345678901234' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('無効な営業IDフォーマットの場合、400エラーを返す', async () => {
    await mockManagerAuth();

    const request = new NextRequest('http://localhost/api/sales/invalid-id');
    const params = Promise.resolve({ id: 'invalid-id' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('管理者以外はアクセス拒否される', async () => {
    await mockNonManagerAuth();

    const request = new NextRequest(`http://localhost/api/sales/${VALID_SALES_ID}`);
    const params = Promise.resolve({ id: VALID_SALES_ID });

    const response = await GET(request, { params });

    expect(response.status).toBe(403);
  });
});

describe('PUT /api/sales/:id', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('管理者は営業情報を更新できる', async () => {
    await mockManagerAuth();
    const { hashPassword } = await import('@/lib/auth');

    // 既存の営業データ
    mockSalesFindUnique.mockResolvedValueOnce({
      id: VALID_SALES_ID,
      salesCode: 'S001',
      salesName: '佐藤花子',
      email: 'sato@example.com',
      department: '営業1課',
      isManager: false,
    } as any);

    // メールアドレス重複チェック（重複なし）
    mockSalesFindUnique.mockResolvedValueOnce(null);

    // 上司が存在して、管理者である
    mockSalesFindUnique.mockResolvedValueOnce({
      id: VALID_MANAGER_ID,
      salesCode: 'M001',
      salesName: '山田太郎',
      isManager: true,
    } as any);

    vi.mocked(hashPassword).mockResolvedValue('$2a$10$newhashedpassword');

    mockSalesUpdate.mockResolvedValue({
      id: VALID_SALES_ID,
      salesCode: 'S001',
      salesName: '佐藤花子（更新）',
      email: 'sato_new@example.com',
      passwordHash: '$2a$10$newhashedpassword',
      department: '営業2課',
      managerId: VALID_MANAGER_ID,
      isManager: false,
      createdAt: new Date('2025-12-01T10:00:00Z'),
      updatedAt: new Date('2026-01-18T11:00:00Z'),
    });

    const request = new NextRequest(`http://localhost/api/sales/${VALID_SALES_ID}`, {
      method: 'PUT',
      body: JSON.stringify({
        sales_name: '佐藤花子（更新）',
        email: 'sato_new@example.com',
        password: 'NewPass1234!@',
        department: '営業2課',
        manager_id: VALID_MANAGER_ID,
        is_manager: false,
      }),
    });
    const params = Promise.resolve({ id: VALID_SALES_ID });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.sales_id).toBe(VALID_SALES_ID);
    expect(mockSalesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: VALID_SALES_ID },
        data: expect.objectContaining({
          salesName: '佐藤花子（更新）',
          email: 'sato_new@example.com',
          passwordHash: '$2a$10$newhashedpassword',
        }),
      })
    );
  });

  it('パスワードを省略した場合、パスワードは更新されない', async () => {
    await mockManagerAuth();

    mockSalesFindUnique.mockResolvedValueOnce({
      id: VALID_SALES_ID,
      salesCode: 'S001',
      salesName: '佐藤花子',
      email: 'sato@example.com',
      department: '営業1課',
      isManager: false,
    } as any);

    // メールアドレスは変更なし
    mockSalesFindUnique.mockResolvedValueOnce(null);

    mockSalesUpdate.mockResolvedValue({
      id: VALID_SALES_ID,
      updatedAt: new Date('2026-01-18T11:00:00Z'),
    } as any);

    const request = new NextRequest(`http://localhost/api/sales/${VALID_SALES_ID}`, {
      method: 'PUT',
      body: JSON.stringify({
        sales_name: '佐藤花子（更新）',
        email: 'sato@example.com',
        // password は省略
        department: '営業2課',
        is_manager: false,
      }),
    });
    const params = Promise.resolve({ id: VALID_SALES_ID });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(mockSalesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          passwordHash: expect.anything(),
        }),
      })
    );
  });

  it('メールアドレスが重複している場合、409エラーを返す', async () => {
    await mockManagerAuth();

    // 営業の存在確認
    mockSalesFindUnique.mockResolvedValueOnce({
      id: VALID_SALES_ID,
      salesCode: 'S001',
      salesName: '佐藤花子',
      email: 'sato@example.com',
      department: '営業1課',
      isManager: false,
    } as any);

    // メールアドレスが重複
    mockSalesFindUnique.mockResolvedValueOnce({
      id: OTHER_SALES_ID,
      email: 'sato_new@example.com',
    } as any);

    const request = new NextRequest(`http://localhost/api/sales/${VALID_SALES_ID}`, {
      method: 'PUT',
      body: JSON.stringify({
        sales_name: '佐藤花子',
        email: 'sato_new@example.com',
        department: '営業1課',
        is_manager: false,
      }),
    });
    const params = Promise.resolve({ id: VALID_SALES_ID });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_CONFLICT');
  });

  it('管理者ではない営業を上司に指定した場合、エラーを返す', async () => {
    await mockManagerAuth();

    // 既存の営業データ
    mockSalesFindUnique.mockResolvedValueOnce({
      id: VALID_SALES_ID,
      salesCode: 'S001',
      salesName: '佐藤花子',
      email: 'sato@example.com',
      department: '営業1課',
      isManager: false,
    } as any);

    // メールアドレスは変更なし（重複チェックはスキップされる）

    // 上司は存在するが、管理者ではない
    mockSalesFindUnique.mockResolvedValueOnce({
      id: VALID_NON_MANAGER_ID,
      salesCode: 'S002',
      salesName: '鈴木一郎',
      isManager: false,
    } as any);

    const request = new NextRequest(`http://localhost/api/sales/${VALID_SALES_ID}`, {
      method: 'PUT',
      body: JSON.stringify({
        sales_name: '佐藤花子',
        email: 'sato@example.com',
        department: '営業1課',
        manager_id: VALID_NON_MANAGER_ID,
        is_manager: false,
      }),
    });
    const params = Promise.resolve({ id: VALID_SALES_ID });

    const response = await PUT(request, { params });
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

  it('管理者以外はアクセス拒否される', async () => {
    await mockNonManagerAuth();

    const request = new NextRequest(`http://localhost/api/sales/${VALID_SALES_ID}`, {
      method: 'PUT',
      body: JSON.stringify({
        sales_name: '佐藤花子',
        email: 'sato@example.com',
        department: '営業1課',
        is_manager: false,
      }),
    });
    const params = Promise.resolve({ id: VALID_SALES_ID });

    const response = await PUT(request, { params });

    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/sales/:id', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('管理者は使用されていない営業を削除できる', async () => {
    await mockManagerAuth();

    mockSalesFindUnique.mockResolvedValue({
      id: VALID_SALES_ID,
      salesCode: 'S001',
      salesName: '佐藤花子',
    } as any);

    // 日報と顧客で使用されていない
    mockDailyReportCount.mockResolvedValue(0);
    mockCustomerCount.mockResolvedValue(0);

    mockSalesDelete.mockResolvedValue({ id: VALID_SALES_ID });

    const request = new NextRequest(`http://localhost/api/sales/${VALID_SALES_ID}`, {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: VALID_SALES_ID });

    const response = await DELETE(request, { params });

    expect(response.status).toBe(204);
    expect(mockSalesDelete).toHaveBeenCalledWith({
      where: { id: VALID_SALES_ID },
    });
  });

  it('日報で使用されている営業は削除できない', async () => {
    await mockManagerAuth();

    // 営業の存在確認
    mockSalesFindUnique.mockResolvedValue({
      id: VALID_SALES_ID,
      salesCode: 'S001',
      salesName: '佐藤花子',
    } as any);

    // 日報で使用されている
    mockDailyReportCount.mockResolvedValue(5);

    const request = new NextRequest(`http://localhost/api/sales/${VALID_SALES_ID}`, {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: VALID_SALES_ID });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_IN_USE');
    expect(data.error.message).toContain('日報');
  });

  it('顧客で使用されている営業は削除できない', async () => {
    await mockManagerAuth();

    mockSalesFindUnique.mockResolvedValue({
      id: VALID_SALES_ID,
      salesCode: 'S001',
      salesName: '佐藤花子',
    } as any);

    // 日報では使用されていない
    mockDailyReportCount.mockResolvedValue(0);
    // 顧客で使用されている
    mockCustomerCount.mockResolvedValue(3);

    const request = new NextRequest(`http://localhost/api/sales/${VALID_SALES_ID}`, {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: VALID_SALES_ID });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_IN_USE');
    expect(data.error.message).toContain('顧客');
  });

  it('存在しない営業を削除しようとした場合、404エラーを返す', async () => {
    await mockManagerAuth();

    mockSalesFindUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/sales/123456789012345678901234', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: '123456789012345678901234' });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('管理者以外はアクセス拒否される', async () => {
    await mockNonManagerAuth();

    const request = new NextRequest(`http://localhost/api/sales/${VALID_SALES_ID}`, {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: VALID_SALES_ID });

    const response = await DELETE(request, { params });

    expect(response.status).toBe(403);
  });
});
