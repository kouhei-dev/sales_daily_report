/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';

// vi.hoisted を使ってモック関数を定義
const mockDailyReportFindUnique = vi.hoisted(() => vi.fn());
const mockDailyReportUpdate = vi.hoisted(() => vi.fn());
const mockDailyReportDelete = vi.hoisted(() => vi.fn());
const mockCustomerFindMany = vi.hoisted(() => vi.fn());
const mockVisitRecordFindMany = vi.hoisted(() => vi.fn());
const mockVisitRecordDeleteMany = vi.hoisted(() => vi.fn());
const mockVisitRecordUpdate = vi.hoisted(() => vi.fn());
const mockVisitRecordCreate = vi.hoisted(() => vi.fn());
const mockTransaction = vi.hoisted(() => vi.fn());
const mockDisconnect = vi.hoisted(() => vi.fn());

// モックの設定
vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    dailyReport = {
      findUnique: mockDailyReportFindUnique,
      update: mockDailyReportUpdate,
      delete: mockDailyReportDelete,
    };
    customer = {
      findMany: mockCustomerFindMany,
    };
    visitRecord = {
      findMany: mockVisitRecordFindMany,
      deleteMany: mockVisitRecordDeleteMany,
      update: mockVisitRecordUpdate,
      create: mockVisitRecordCreate,
    };
    $transaction = mockTransaction;
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
const mockAuth = async (isManager = false) => {
  const { requireAuth } = await import('@/lib/middleware/auth');
  vi.mocked(requireAuth).mockResolvedValue({
    session: {
      salesId: '507f1f77bcf86cd799439012',
      salesCode: 'S001',
      salesName: '佐藤花子',
      email: 'sato@example.com',
      department: '営業1課',
      isManager: isManager,
      expiresAt: Date.now() + 30 * 60 * 1000,
    },
    error: null,
  } as any);
};

const _mockUnauthorized = async () => {
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

describe('GET /api/reports/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('営業担当者は自分の日報詳細を取得できる', async () => {
    await mockAuth(false);

    mockDailyReportFindUnique.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      salesId: '507f1f77bcf86cd799439012',
      reportDate: new Date('2026-01-12'),
      problem: '問題点',
      plan: '翌日の予定',
      status: 'SUBMITTED',
      submittedAt: new Date('2026-01-12T18:00:00Z'),
      createdAt: new Date('2026-01-12T17:30:00Z'),
      updatedAt: new Date('2026-01-12T18:00:00Z'),
      sales: {
        id: '507f1f77bcf86cd799439012',
        salesName: '佐藤花子',
        department: {
          departmentName: '営業1課',
        },
      },
      visitRecords: [
        {
          id: 'visit-id-1',
          visitDatetime: new Date('2026-01-12T10:00:00Z'),
          visitContent: '訪問内容1',
          visitResult: '訪問結果1',
          displayOrder: 1,
          customer: {
            id: 'customer-id-1',
            customerCode: 'C001',
            customerName: 'A株式会社',
          },
        },
      ],
      comments: [
        {
          id: 'comment-id-1',
          commentType: 'PROBLEM',
          commentText: 'コメント内容',
          isRead: false,
          readAt: null,
          createdAt: new Date('2026-01-12T19:00:00Z'),
          commenter: {
            id: 'manager-id-1',
            salesName: '山田太郎',
          },
        },
      ],
    });

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });
    const request = new NextRequest('http://localhost/api/reports/507f1f77bcf86cd799439011');

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.report_id).toBe('507f1f77bcf86cd799439011');
    expect(data.data.visit_records).toHaveLength(1);
    expect(data.data.comments.problem).toHaveLength(1);
    expect(data.data.comments.plan).toHaveLength(0);
  });

  it('管理者は他人の日報詳細を取得できる', async () => {
    await mockAuth(true);

    mockDailyReportFindUnique.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      salesId: '507f1f77bcf86cd799439013',
      reportDate: new Date('2026-01-12'),
      problem: '問題点',
      plan: '翌日の予定',
      status: 'SUBMITTED',
      submittedAt: new Date('2026-01-12T18:00:00Z'),
      createdAt: new Date('2026-01-12T17:30:00Z'),
      updatedAt: new Date('2026-01-12T18:00:00Z'),
      sales: {
        id: '507f1f77bcf86cd799439013',
        salesName: '田中太郎',
        department: {
          departmentName: '営業2課',
        },
      },
      visitRecords: [],
      comments: [],
    });

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });
    const request = new NextRequest('http://localhost/api/reports/507f1f77bcf86cd799439011');

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
  });

  it('営業担当者が他人の日報を取得しようとすると403エラー', async () => {
    await mockAuth(false);

    mockDailyReportFindUnique.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      salesId: '507f1f77bcf86cd799439013',
      reportDate: new Date('2026-01-12'),
      problem: null,
      plan: null,
      status: 'DRAFT',
      submittedAt: null,
      createdAt: new Date('2026-01-12T17:30:00Z'),
      updatedAt: new Date('2026-01-12T17:30:00Z'),
      sales: {
        id: '507f1f77bcf86cd799439013',
        salesName: '田中太郎',
        department: {
          departmentName: '営業2課',
        },
      },
      visitRecords: [],
      comments: [],
    });

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });
    const request = new NextRequest('http://localhost/api/reports/507f1f77bcf86cd799439011');

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('AUTH_FORBIDDEN');
  });

  it('存在しない日報IDの場合は404エラー', async () => {
    await mockAuth(false);

    mockDailyReportFindUnique.mockResolvedValue(null);

    const params = Promise.resolve({ id: '000000000000000000000000' });
    const request = new NextRequest('http://localhost/api/reports/000000000000000000000000');

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('無効な日報IDの場合は400エラー', async () => {
    await mockAuth(false);

    const params = Promise.resolve({ id: 'invalid-id' });
    const request = new NextRequest('http://localhost/api/reports/invalid-id');

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PUT /api/reports/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('日報を更新できる', async () => {
    await mockAuth(false);

    mockDailyReportFindUnique.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      salesId: '507f1f77bcf86cd799439012',
      status: 'DRAFT',
      submittedAt: null,
      visitRecords: [{ id: '507f1f77bcf86cd799439014' }],
    });

    mockCustomerFindMany.mockResolvedValue([{ id: '507f1f77bcf86cd799439015' }]);
    mockVisitRecordFindMany.mockResolvedValue([{ id: '507f1f77bcf86cd799439014' }]);

    const mockUpdatedReport = {
      id: '507f1f77bcf86cd799439011',
      updatedAt: new Date('2026-01-12T19:00:00Z'),
    };

    mockTransaction.mockImplementation(async (callback: any) => {
      return await callback({
        dailyReport: {
          update: mockDailyReportUpdate.mockResolvedValue(mockUpdatedReport),
        },
        visitRecord: {
          deleteMany: mockVisitRecordDeleteMany.mockResolvedValue({ count: 0 }),
          update: mockVisitRecordUpdate.mockResolvedValue({}),
          create: mockVisitRecordCreate.mockResolvedValue({}),
        },
      });
    });

    const requestBody = {
      problem: '更新された問題点',
      plan: '更新された予定',
      status: 'submitted',
      visit_records: [
        {
          visit_id: '507f1f77bcf86cd799439014',
          customer_id: '507f1f77bcf86cd799439015',
          visit_datetime: '2026-01-12T10:00:00.000Z',
          visit_content: '更新された訪問内容',
          visit_result: '更新された訪問結果',
          display_order: 1,
        },
      ],
    };

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });
    const request = new NextRequest('http://localhost/api/reports/507f1f77bcf86cd799439011', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.report_id).toBe('507f1f77bcf86cd799439011');
  });

  it('他人の日報を更新しようとすると403エラー', async () => {
    await mockAuth(false);

    mockDailyReportFindUnique.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      salesId: '507f1f77bcf86cd799439013',
      status: 'DRAFT',
      submittedAt: null,
      visitRecords: [],
    });

    const requestBody = {
      problem: '更新された問題点',
      status: 'draft',
      visit_records: [
        {
          customer_id: '507f1f77bcf86cd799439015',
          visit_datetime: '2026-01-12T10:00:00.000Z',
          visit_content: '訪問内容',
          display_order: 1,
        },
      ],
    };

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });
    const request = new NextRequest('http://localhost/api/reports/507f1f77bcf86cd799439011', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('AUTH_FORBIDDEN');
  });

  it('存在しない日報IDの場合は404エラー', async () => {
    await mockAuth(false);

    mockDailyReportFindUnique.mockResolvedValue(null);

    const requestBody = {
      status: 'draft',
      visit_records: [
        {
          customer_id: '507f1f77bcf86cd799439015',
          visit_datetime: '2026-01-12T10:00:00.000Z',
          visit_content: '訪問内容',
          display_order: 1,
        },
      ],
    };

    const params = Promise.resolve({ id: '000000000000000000000000' });
    const request = new NextRequest('http://localhost/api/reports/000000000000000000000000', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });
});

describe('DELETE /api/reports/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('日報を削除できる', async () => {
    await mockAuth(false);

    mockDailyReportFindUnique.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      salesId: '507f1f77bcf86cd799439012',
    });

    mockDailyReportDelete.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
    });

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });
    const request = new NextRequest('http://localhost/api/reports/507f1f77bcf86cd799439011', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params });

    expect(response.status).toBe(204);
  });

  it('他人の日報を削除しようとすると403エラー', async () => {
    await mockAuth(false);

    mockDailyReportFindUnique.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      salesId: '507f1f77bcf86cd799439013',
    });

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });
    const request = new NextRequest('http://localhost/api/reports/507f1f77bcf86cd799439011', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('AUTH_FORBIDDEN');
  });

  it('存在しない日報IDの場合は404エラー', async () => {
    await mockAuth(false);

    mockDailyReportFindUnique.mockResolvedValue(null);

    const params = Promise.resolve({ id: '000000000000000000000000' });
    const request = new NextRequest('http://localhost/api/reports/000000000000000000000000', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });
});
