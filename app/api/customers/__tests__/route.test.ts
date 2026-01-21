/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// vi.hoisted を使ってモック関数を定義
const mockCustomerFindMany = vi.hoisted(() => vi.fn());
const mockCustomerCount = vi.hoisted(() => vi.fn());
const mockCustomerFindUnique = vi.hoisted(() => vi.fn());
const mockCustomerCreate = vi.hoisted(() => vi.fn());
const mockSalesFindUnique = vi.hoisted(() => vi.fn());
const mockDisconnect = vi.hoisted(() => vi.fn());

// モックの設定
vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    customer = {
      findMany: mockCustomerFindMany,
      count: mockCustomerCount,
      findUnique: mockCustomerFindUnique,
      create: mockCustomerCreate,
    };
    sales = {
      findUnique: mockSalesFindUnique,
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

describe('GET /api/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('認証済みユーザーは顧客一覧を取得できる', async () => {
    await mockAuth();

    mockCustomerCount.mockResolvedValue(2);
    mockCustomerFindMany.mockResolvedValue([
      {
        id: 'customer-id-1',
        customerCode: 'C001',
        customerName: 'A株式会社',
        industry: '製造業',
        postalCode: null,
        address: '東京都千代田区...',
        phone: '03-1234-5678',
        salesId: 'sales-id-1',
        notes: null,
        createdAt: new Date('2025-12-01T10:00:00Z'),
        updatedAt: new Date('2026-01-10T15:00:00Z'),
        sales: {
          id: 'sales-id-1',
          salesName: '佐藤花子',
        },
      },
      {
        id: 'customer-id-2',
        customerCode: 'C002',
        customerName: 'B株式会社',
        industry: 'IT',
        postalCode: null,
        address: '東京都港区...',
        phone: '03-9876-5432',
        salesId: 'sales-id-1',
        notes: null,
        createdAt: new Date('2025-12-05T10:00:00Z'),
        updatedAt: new Date('2026-01-12T15:00:00Z'),
        sales: {
          id: 'sales-id-1',
          salesName: '佐藤花子',
        },
      },
    ]);

    const request = new NextRequest('http://localhost/api/customers?page=1&limit=20');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.items).toHaveLength(2);
    expect(data.data.items[0].customer_code).toBe('C001');
    expect(data.data.items[0].customer_name).toBe('A株式会社');
    expect(data.data.items[0].sales.sales_name).toBe('佐藤花子');
    expect(data.data.pagination.total_items).toBe(2);
    expect(data.data.pagination.current_page).toBe(1);
  });

  it('クエリパラメータでフィルタリングできる', async () => {
    await mockAuth();

    mockCustomerCount.mockResolvedValue(1);
    mockCustomerFindMany.mockResolvedValue([
      {
        id: 'customer-id-1',
        customerCode: 'C001',
        customerName: 'A株式会社',
        industry: '製造業',
        postalCode: null,
        address: '東京都千代田区...',
        phone: '03-1234-5678',
        salesId: 'sales-id-1',
        notes: null,
        createdAt: new Date('2025-12-01T10:00:00Z'),
        updatedAt: new Date('2026-01-10T15:00:00Z'),
        sales: {
          id: 'sales-id-1',
          salesName: '佐藤花子',
        },
      },
    ]);

    const request = new NextRequest(
      'http://localhost/api/customers?customer_name=株式会社&customer_code=C001'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.items).toHaveLength(1);
    expect(mockCustomerFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          customerName: { contains: '株式会社', mode: 'insensitive' },
          customerCode: { contains: 'C001', mode: 'insensitive' },
        }),
      })
    );
  });

  it('未認証ユーザーはアクセス拒否される', async () => {
    await mockUnauthorized();

    const request = new NextRequest('http://localhost/api/customers');

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('無効なページ番号の場合、バリデーションエラーを返す', async () => {
    await mockAuth();

    const request = new NextRequest('http://localhost/api/customers?page=0');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('認証済みユーザーは顧客を作成できる', async () => {
    await mockAuth();

    const validSalesId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId

    // 顧客コードが重複していない
    mockCustomerFindUnique.mockResolvedValueOnce(null);
    // 営業が存在する
    mockSalesFindUnique.mockResolvedValueOnce({
      id: validSalesId,
      salesCode: 'S001',
      salesName: '佐藤花子',
    } as any);

    mockCustomerCreate.mockResolvedValue({
      id: 'new-customer-id',
      customerCode: 'C999',
      customerName: 'テスト株式会社',
      industry: 'IT',
      postalCode: '100-0001',
      address: '東京都千代田区千代田1-1-1',
      phone: '03-1234-5678',
      salesId: validSalesId,
      notes: '新規顧客',
      createdAt: new Date('2026-01-18T10:00:00Z'),
      updatedAt: new Date('2026-01-18T10:00:00Z'),
    });

    const request = new NextRequest('http://localhost/api/customers', {
      method: 'POST',
      body: JSON.stringify({
        customer_code: 'C999',
        customer_name: 'テスト株式会社',
        industry: 'IT',
        postal_code: '100-0001',
        address: '東京都千代田区千代田1-1-1',
        phone: '03-1234-5678',
        sales_id: validSalesId,
        notes: '新規顧客',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.status).toBe('success');
    expect(data.data.customer_code).toBe('C999');
    expect(data.data.customer_name).toBe('テスト株式会社');
    expect(mockCustomerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerCode: 'C999',
          customerName: 'テスト株式会社',
          industry: 'IT',
          postalCode: '100-0001',
          address: '東京都千代田区千代田1-1-1',
          phone: '03-1234-5678',
          salesId: validSalesId,
          notes: '新規顧客',
        }),
      })
    );
  });

  it('顧客コードが重複している場合、409エラーを返す', async () => {
    await mockAuth();

    mockCustomerFindUnique.mockResolvedValueOnce({
      id: 'existing-customer-id',
      customerCode: 'C001',
    } as any);

    const request = new NextRequest('http://localhost/api/customers', {
      method: 'POST',
      body: JSON.stringify({
        customer_code: 'C001',
        customer_name: 'A株式会社',
        sales_id: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_CONFLICT');
  });

  it('営業が存在しない場合、400エラーを返す', async () => {
    await mockAuth();

    const invalidSalesId = '507f1f77bcf86cd799439099';

    // 顧客コードが重複していない
    mockCustomerFindUnique.mockResolvedValueOnce(null);
    // 営業が存在しない
    mockSalesFindUnique.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/customers', {
      method: 'POST',
      body: JSON.stringify({
        customer_code: 'C999',
        customer_name: 'テスト株式会社',
        sales_id: invalidSalesId,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details).toEqual([
      { field: 'sales_id', message: '指定された営業が見つかりません' },
    ]);
  });

  it('必須フィールドが不足している場合、バリデーションエラーを返す', async () => {
    await mockAuth();

    const request = new NextRequest('http://localhost/api/customers', {
      method: 'POST',
      body: JSON.stringify({
        customer_code: 'C999',
        // customer_name が不足
        sales_id: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('郵便番号の形式が正しくない場合、バリデーションエラーを返す', async () => {
    await mockAuth();

    const request = new NextRequest('http://localhost/api/customers', {
      method: 'POST',
      body: JSON.stringify({
        customer_code: 'C999',
        customer_name: 'テスト株式会社',
        postal_code: '1234567', // 正しくない形式
        sales_id: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('電話番号の形式が正しくない場合、バリデーションエラーを返す', async () => {
    await mockAuth();

    const request = new NextRequest('http://localhost/api/customers', {
      method: 'POST',
      body: JSON.stringify({
        customer_code: 'C999',
        customer_name: 'テスト株式会社',
        phone: '1234567890', // 正しくない形式
        sales_id: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('未認証ユーザーは顧客を作成できない', async () => {
    await mockUnauthorized();

    const request = new NextRequest('http://localhost/api/customers', {
      method: 'POST',
      body: JSON.stringify({
        customer_code: 'C999',
        customer_name: 'テスト株式会社',
        sales_id: '507f1f77bcf86cd799439011',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});
