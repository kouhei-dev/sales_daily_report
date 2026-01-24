/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// vi.hoisted を使ってモック関数を定義
const mockDailyReportFindMany = vi.hoisted(() => vi.fn());
const mockDailyReportCount = vi.hoisted(() => vi.fn());
const mockDailyReportFindFirst = vi.hoisted(() => vi.fn());
const mockDailyReportCreate = vi.hoisted(() => vi.fn());
const mockCustomerFindMany = vi.hoisted(() => vi.fn());
const mockVisitRecordCreateMany = vi.hoisted(() => vi.fn());
const mockTransaction = vi.hoisted(() => vi.fn());
const mockDisconnect = vi.hoisted(() => vi.fn());

// モックの設定
vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    dailyReport = {
      findMany: mockDailyReportFindMany,
      count: mockDailyReportCount,
      findFirst: mockDailyReportFindFirst,
      create: mockDailyReportCreate,
    };
    customer = {
      findMany: mockCustomerFindMany,
    };
    visitRecord = {
      createMany: mockVisitRecordCreateMany,
    };
    $transaction = mockTransaction;
    $disconnect = mockDisconnect;
  }

  return {
    PrismaClient: MockPrismaClient,
    Prisma: {
      DailyReportWhereInput: {},
    },
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

describe('GET /api/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('営業担当者は自分の日報一覧を取得できる', async () => {
    await mockAuth(false);

    mockDailyReportCount.mockResolvedValue(2);
    mockDailyReportFindMany.mockResolvedValue([
      {
        id: 'report-id-1',
        salesId: 'sales-id-1',
        reportDate: new Date('2026-01-12'),
        problem: '問題点',
        plan: '翌日の予定',
        status: 'SUBMITTED',
        submittedAt: new Date('2026-01-12T18:00:00Z'),
        createdAt: new Date('2026-01-12T17:30:00Z'),
        updatedAt: new Date('2026-01-12T18:00:00Z'),
        sales: {
          id: 'sales-id-1',
          salesName: '佐藤花子',
        },
        visitRecords: [{ id: 'visit-id-1' }, { id: 'visit-id-2' }],
        comments: [
          {
            id: 'comment-id-1',
            isRead: false,
            dailyReport: { salesId: 'sales-id-1' },
          },
        ],
      },
      {
        id: 'report-id-2',
        salesId: 'sales-id-1',
        reportDate: new Date('2026-01-11'),
        problem: null,
        plan: null,
        status: 'DRAFT',
        submittedAt: null,
        createdAt: new Date('2026-01-11T17:30:00Z'),
        updatedAt: new Date('2026-01-11T17:30:00Z'),
        sales: {
          id: 'sales-id-1',
          salesName: '佐藤花子',
        },
        visitRecords: [{ id: 'visit-id-3' }],
        comments: [],
      },
    ]);

    const url = new URL('http://localhost/api/reports?page=1&limit=20');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.items).toHaveLength(2);
    expect(data.data.items[0].report_id).toBe('report-id-1');
    expect(data.data.items[0].visit_count).toBe(2);
    expect(data.data.items[0].status).toBe('submitted');
    expect(data.data.items[0].unread_comment_count).toBe(1);
    expect(data.data.pagination.total_items).toBe(2);
  });

  it('管理者は全員分の日報一覧を取得できる', async () => {
    await mockAuth(true);

    mockDailyReportCount.mockResolvedValue(1);
    mockDailyReportFindMany.mockResolvedValue([
      {
        id: 'report-id-1',
        salesId: 'sales-id-2',
        reportDate: new Date('2026-01-12'),
        problem: '問題点',
        plan: '翌日の予定',
        status: 'SUBMITTED',
        submittedAt: new Date('2026-01-12T18:00:00Z'),
        createdAt: new Date('2026-01-12T17:30:00Z'),
        updatedAt: new Date('2026-01-12T18:00:00Z'),
        sales: {
          id: 'sales-id-2',
          salesName: '田中太郎',
        },
        visitRecords: [],
        comments: [],
      },
    ]);

    const url = new URL('http://localhost/api/reports');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.items).toHaveLength(1);
  });

  it('営業担当者が他人の日報を取得しようとすると403エラー', async () => {
    await mockAuth(false);

    const url = new URL('http://localhost/api/reports?sales_id=507f1f77bcf86cd799439013');
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(403);
  });

  it('未認証の場合は401エラー', async () => {
    await mockUnauthorized();

    const url = new URL('http://localhost/api/reports');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.status).toBe('error');
  });

  it('日付範囲でフィルタできる', async () => {
    await mockAuth(false);

    mockDailyReportCount.mockResolvedValue(1);
    mockDailyReportFindMany.mockResolvedValue([
      {
        id: 'report-id-1',
        salesId: 'sales-id-1',
        reportDate: new Date('2026-01-12'),
        problem: null,
        plan: null,
        status: 'DRAFT',
        submittedAt: null,
        createdAt: new Date('2026-01-12T17:30:00Z'),
        updatedAt: new Date('2026-01-12T17:30:00Z'),
        sales: {
          id: 'sales-id-1',
          salesName: '佐藤花子',
        },
        visitRecords: [],
        comments: [],
      },
    ]);

    const url = new URL('http://localhost/api/reports?start_date=2026-01-01&end_date=2026-01-31');
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(200);

    // 日付範囲がパラメータ通りに設定されているか確認
    const callArgs = mockDailyReportFindMany.mock.calls[0][0];
    expect(callArgs.where.reportDate.gte).toEqual(new Date('2026-01-01'));
    // end_dateは当日の23:59:59まで含めるため、ローカルタイムで設定される
    const expectedEndDate = new Date('2026-01-31');
    expectedEndDate.setHours(23, 59, 59, 999);
    expect(callArgs.where.reportDate.lte).toEqual(expectedEndDate);
  });

  it('マネージャーは他人のdraft日報を取得できない', async () => {
    await mockAuth(true); // マネージャーとしてログイン

    const mockReports = [
      {
        id: 'report-1',
        salesId: 'other-sales-id', // 他人の日報
        reportDate: new Date('2026-01-15'),
        status: 'DRAFT',
        sales: { id: 'other-sales-id', salesName: '他の営業担当' },
        visitRecords: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'report-2',
        salesId: 'other-sales-id',
        reportDate: new Date('2026-01-16'),
        status: 'SUBMITTED',
        submittedAt: new Date(),
        sales: { id: 'other-sales-id', salesName: '他の営業担当' },
        visitRecords: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockDailyReportCount.mockResolvedValue(2);
    mockDailyReportFindMany.mockResolvedValue(mockReports);

    const url = new URL('http://localhost/api/reports');
    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    // draftは除外され、submittedのみが返される
    expect(data.data.items).toHaveLength(1);
    expect(data.data.items[0].status).toBe('submitted');
  });

  it('マネージャーは自分のdraft日報は取得できる', async () => {
    await mockAuth(true); // マネージャーとしてログイン

    const mockReports = [
      {
        id: 'report-1',
        salesId: '507f1f77bcf86cd799439012', // 自分の日報
        reportDate: new Date('2026-01-15'),
        status: 'DRAFT',
        sales: { id: '507f1f77bcf86cd799439012', salesName: 'テスト営業' },
        visitRecords: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockDailyReportCount.mockResolvedValue(1);
    mockDailyReportFindMany.mockResolvedValue(mockReports);

    const url = new URL('http://localhost/api/reports');
    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    // 自分のdraftは表示される
    expect(data.data.items).toHaveLength(1);
    expect(data.data.items[0].status).toBe('draft');
  });

  it('未読コメント数は本人以外が書いたコメントのみカウントする', async () => {
    await mockAuth(false);

    const mockReports = [
      {
        id: 'report-1',
        salesId: '507f1f77bcf86cd799439012',
        reportDate: new Date('2026-01-15'),
        status: 'COMMENTED',
        sales: { id: '507f1f77bcf86cd799439012', salesName: 'テスト営業' },
        visitRecords: [],
        comments: [
          { id: 'comment-1', isRead: false, commenterId: '507f1f77bcf86cd799439012' }, // 本人のコメント
          { id: 'comment-2', isRead: false, commenterId: 'manager-id' }, // 他人のコメント
          { id: 'comment-3', isRead: true, commenterId: 'manager-id' }, // 既読
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockDailyReportCount.mockResolvedValue(1);
    mockDailyReportFindMany.mockResolvedValue(mockReports);

    const url = new URL('http://localhost/api/reports');
    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    // 未読コメント数は1（本人以外の未読コメントのみ）
    expect(data.data.items[0].unread_comment_count).toBe(1);
  });
});

describe('POST /api/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('日報を作成できる', async () => {
    await mockAuth(false);

    mockDailyReportFindFirst.mockResolvedValue(null);
    mockCustomerFindMany.mockResolvedValue([
      { id: '507f1f77bcf86cd799439014' },
      { id: '507f1f77bcf86cd799439015' },
    ]);

    const mockReport = {
      id: 'report-id-1',
      salesId: 'sales-id-1',
      reportDate: new Date('2026-01-12'),
      problem: '問題点',
      plan: '翌日の予定',
      status: 'SUBMITTED',
      submittedAt: new Date('2026-01-12T18:00:00Z'),
      createdAt: new Date('2026-01-12T17:30:00Z'),
      updatedAt: new Date('2026-01-12T18:00:00Z'),
    };

    mockTransaction.mockImplementation(async (callback: any) => {
      return await callback({
        dailyReport: {
          create: mockDailyReportCreate.mockResolvedValue(mockReport),
        },
        visitRecord: {
          createMany: mockVisitRecordCreateMany.mockResolvedValue({ count: 2 }),
        },
      });
    });

    const requestBody = {
      report_date: '2026-01-12',
      problem: '問題点',
      plan: '翌日の予定',
      status: 'submitted',
      visit_records: [
        {
          customer_id: '507f1f77bcf86cd799439014',
          visit_datetime: '2026-01-12T10:00:00.000Z',
          visit_content: '訪問内容1',
          visit_result: '訪問結果1',
          display_order: 1,
        },
        {
          customer_id: '507f1f77bcf86cd799439015',
          visit_datetime: '2026-01-12T14:00:00.000Z',
          visit_content: '訪問内容2',
          display_order: 2,
        },
      ],
    };

    const request = new NextRequest('http://localhost/api/reports', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.status).toBe('success');
    expect(data.data.report_id).toBe('report-id-1');
    expect(data.data.status).toBe('submitted');
  });

  it('同一日付の日報が既に存在する場合は409エラー', async () => {
    await mockAuth(false);

    mockDailyReportFindFirst.mockResolvedValue({
      id: 'existing-report-id',
      salesId: 'sales-id-1',
      reportDate: new Date('2026-01-12'),
    });

    const requestBody = {
      report_date: '2026-01-12',
      status: 'draft',
      visit_records: [
        {
          customer_id: '507f1f77bcf86cd799439014',
          visit_datetime: '2026-01-12T10:00:00.000Z',
          visit_content: '訪問内容',
          display_order: 1,
        },
      ],
    };

    const request = new NextRequest('http://localhost/api/reports', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('RESOURCE_CONFLICT');
  });

  it('バリデーションエラー: 訪問記録が0件', async () => {
    await mockAuth(false);

    const requestBody = {
      report_date: '2026-01-12',
      status: 'draft',
      visit_records: [],
    };

    const request = new NextRequest('http://localhost/api/reports', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('バリデーションエラー: 訪問記録が11件以上', async () => {
    await mockAuth(false);

    const requestBody = {
      report_date: '2026-01-12',
      status: 'draft',
      visit_records: Array(11)
        .fill(null)
        .map((_, i) => ({
          customer_id: '507f1f77bcf86cd799439014',
          visit_datetime: '2026-01-12T10:00:00.000Z',
          visit_content: `訪問内容${i + 1}`,
          display_order: i + 1,
        })),
    };

    const request = new NextRequest('http://localhost/api/reports', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('存在しない顧客IDの場合は400エラー', async () => {
    await mockAuth(false);

    mockDailyReportFindFirst.mockResolvedValue(null);
    mockCustomerFindMany.mockResolvedValue([]);

    const requestBody = {
      report_date: '2026-01-12',
      status: 'draft',
      visit_records: [
        {
          customer_id: 'invalid-customer-id',
          visit_datetime: '2026-01-12T10:00:00.000Z',
          visit_content: '訪問内容',
          display_order: 1,
        },
      ],
    };

    const request = new NextRequest('http://localhost/api/reports', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.status).toBe('error');
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
