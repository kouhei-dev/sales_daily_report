/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';

// vi.hoisted を使ってモック関数を定義
const mockCustomerFindUnique = vi.hoisted(() => vi.fn());
const mockCustomerUpdate = vi.hoisted(() => vi.fn());
const mockCustomerDelete = vi.hoisted(() => vi.fn());
const mockSalesFindUnique = vi.hoisted(() => vi.fn());
const mockVisitRecordCount = vi.hoisted(() => vi.fn());
const mockDisconnect = vi.hoisted(() => vi.fn());

// モックの設定
vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    customer = {
      findUnique: mockCustomerFindUnique,
      update: mockCustomerUpdate,
      delete: mockCustomerDelete,
    };
    sales = {
      findUnique: mockSalesFindUnique,
    };
    visitRecord = {
      count: mockVisitRecordCount,
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

describe('GET /api/customers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('認証済みユーザーは顧客詳細を取得できる', async () => {
    await mockAuth();

    const validCustomerId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId
    const validSalesId = '507f1f77bcf86cd799439022'; // Valid MongoDB ObjectId

    mockCustomerFindUnique.mockResolvedValue({
      id: validCustomerId,
      customerCode: 'C001',
      customerName: 'A株式会社',
      industry: '製造業',
      postalCode: '100-0001',
      address: '東京都千代田区千代田1-1-1',
      phone: '03-1234-5678',
      salesId: validSalesId,
      notes: '重要顧客',
      createdAt: new Date('2025-12-01T10:00:00Z'),
      updatedAt: new Date('2026-01-10T15:00:00Z'),
      sales: {
        id: validSalesId,
        salesName: '佐藤花子',
        department: {
          departmentName: '営業1課',
        },
      },
    });

    const params = Promise.resolve({ id: validCustomerId });
    const request = new NextRequest(`http://localhost/api/customers/${validCustomerId}`);

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.customer_code).toBe('C001');
    expect(data.data.customer_name).toBe('A株式会社');
    expect(data.data.sales.sales_name).toBe('佐藤花子');
    expect(data.data.sales.department).toBe('営業1課');
    expect(data.data.notes).toBe('重要顧客');
  });

  it('顧客が存在しない場合、404エラーを返す', async () => {
    await mockAuth();

    mockCustomerFindUnique.mockResolvedValue(null);

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });
    const request = new NextRequest('http://localhost/api/customers/507f1f77bcf86cd799439011');

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('無効な顧客IDの場合、400エラーを返す', async () => {
    await mockAuth();

    const params = Promise.resolve({ id: 'invalid-id' });
    const request = new NextRequest('http://localhost/api/customers/invalid-id');

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('未認証ユーザーはアクセス拒否される', async () => {
    await mockUnauthorized();

    const validCustomerId = '507f1f77bcf86cd799439011';
    const params = Promise.resolve({ id: validCustomerId });
    const request = new NextRequest(`http://localhost/api/customers/${validCustomerId}`);

    const response = await GET(request, { params });

    expect(response.status).toBe(401);
  });
});

describe('PUT /api/customers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('認証済みユーザーは顧客を更新できる', async () => {
    await mockAuth();

    const validCustomerId = '507f1f77bcf86cd799439011';
    const validSalesId = '507f1f77bcf86cd799439022';

    // 顧客が存在する
    mockCustomerFindUnique.mockResolvedValueOnce({
      id: validCustomerId,
      customerCode: 'C001',
      customerName: 'A株式会社',
    } as any);

    // 営業が存在する
    mockSalesFindUnique.mockResolvedValueOnce({
      id: validSalesId,
      salesCode: 'S002',
      salesName: '鈴木一郎',
    } as any);

    mockCustomerUpdate.mockResolvedValue({
      id: validCustomerId,
      customerCode: 'C001',
      customerName: 'A株式会社（更新）',
      industry: '製造業',
      postalCode: '100-0002',
      address: '東京都千代田区千代田2-2-2',
      phone: '03-9876-5432',
      salesId: validSalesId,
      notes: '住所変更あり',
      updatedAt: new Date('2026-01-18T11:00:00Z'),
    });

    const params = Promise.resolve({ id: validCustomerId });
    const request = new NextRequest(`http://localhost/api/customers/${validCustomerId}`, {
      method: 'PUT',
      body: JSON.stringify({
        customer_name: 'A株式会社（更新）',
        industry: '製造業',
        postal_code: '100-0002',
        address: '東京都千代田区千代田2-2-2',
        phone: '03-9876-5432',
        sales_id: validSalesId,
        notes: '住所変更あり',
      }),
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.customer_id).toBe(validCustomerId);
    expect(mockCustomerUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: validCustomerId },
        data: expect.objectContaining({
          customerName: 'A株式会社（更新）',
          industry: '製造業',
          postalCode: '100-0002',
          address: '東京都千代田区千代田2-2-2',
          phone: '03-9876-5432',
          salesId: validSalesId,
          notes: '住所変更あり',
        }),
      })
    );
  });

  it('顧客が存在しない場合、404エラーを返す', async () => {
    await mockAuth();

    const validCustomerId = '507f1f77bcf86cd799439011';

    mockCustomerFindUnique.mockResolvedValueOnce(null);

    const params = Promise.resolve({ id: validCustomerId });
    const request = new NextRequest(`http://localhost/api/customers/${validCustomerId}`, {
      method: 'PUT',
      body: JSON.stringify({
        customer_name: 'A株式会社',
        sales_id: '507f1f77bcf86cd799439022',
      }),
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('営業が存在しない場合、400エラーを返す', async () => {
    await mockAuth();

    const validCustomerId = '507f1f77bcf86cd799439011';
    const invalidSalesId = '507f1f77bcf86cd799439099';

    // 顧客が存在する
    mockCustomerFindUnique.mockResolvedValueOnce({
      id: validCustomerId,
      customerCode: 'C001',
    } as any);

    // 営業が存在しない
    mockSalesFindUnique.mockResolvedValueOnce(null);

    const params = Promise.resolve({ id: validCustomerId });
    const request = new NextRequest(`http://localhost/api/customers/${validCustomerId}`, {
      method: 'PUT',
      body: JSON.stringify({
        customer_name: 'A株式会社',
        sales_id: invalidSalesId,
      }),
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('無効な顧客IDの場合、400エラーを返す', async () => {
    await mockAuth();

    const params = Promise.resolve({ id: 'invalid-id' });
    const request = new NextRequest('http://localhost/api/customers/invalid-id', {
      method: 'PUT',
      body: JSON.stringify({
        customer_name: 'A株式会社',
        sales_id: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('未認証ユーザーは顧客を更新できない', async () => {
    await mockUnauthorized();

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });
    const request = new NextRequest('http://localhost/api/customers/507f1f77bcf86cd799439011', {
      method: 'PUT',
      body: JSON.stringify({
        customer_name: 'A株式会社',
        sales_id: '507f1f77bcf86cd799439022',
      }),
    });

    const response = await PUT(request, { params });

    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/customers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('認証済みユーザーは顧客を削除できる', async () => {
    await mockAuth();

    const validCustomerId = '507f1f77bcf86cd799439011';

    // 顧客が存在する
    mockCustomerFindUnique.mockResolvedValueOnce({
      id: validCustomerId,
      customerCode: 'C001',
    } as any);

    // 訪問記録で使用されていない
    mockVisitRecordCount.mockResolvedValueOnce(0);

    mockCustomerDelete.mockResolvedValue({
      id: validCustomerId,
    });

    const params = Promise.resolve({ id: validCustomerId });
    const request = new NextRequest(`http://localhost/api/customers/${validCustomerId}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params });

    expect(response.status).toBe(204);
    expect(mockCustomerDelete).toHaveBeenCalledWith({
      where: { id: validCustomerId },
    });
  });

  it('顧客が存在しない場合、404エラーを返す', async () => {
    await mockAuth();

    const validCustomerId = '507f1f77bcf86cd799439011';

    mockCustomerFindUnique.mockResolvedValueOnce(null);

    const params = Promise.resolve({ id: validCustomerId });
    const request = new NextRequest(`http://localhost/api/customers/${validCustomerId}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('訪問記録で使用されている場合、削除できない', async () => {
    await mockAuth();

    const validCustomerId = '507f1f77bcf86cd799439011';

    // 顧客が存在する
    mockCustomerFindUnique.mockResolvedValueOnce({
      id: validCustomerId,
      customerCode: 'C001',
    } as any);

    // 訪問記録で使用されている
    mockVisitRecordCount.mockResolvedValueOnce(3);

    const params = Promise.resolve({ id: validCustomerId });
    const request = new NextRequest(`http://localhost/api/customers/${validCustomerId}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_IN_USE');
    expect(mockCustomerDelete).not.toHaveBeenCalled();
  });

  it('無効な顧客IDの場合、400エラーを返す', async () => {
    await mockAuth();

    const params = Promise.resolve({ id: 'invalid-id' });
    const request = new NextRequest('http://localhost/api/customers/invalid-id', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('未認証ユーザーは顧客を削除できない', async () => {
    await mockUnauthorized();

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });
    const request = new NextRequest('http://localhost/api/customers/507f1f77bcf86cd799439011', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params });

    expect(response.status).toBe(401);
  });
});
