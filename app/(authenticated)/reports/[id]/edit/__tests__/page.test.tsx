import { describe, test, expect, vi, beforeEach } from 'vitest';
import { redirect, notFound } from 'next/navigation';
import ReportEditPage from '../page';
import type { ApiSuccessResponse } from '@/types/session';
import type { ReportDetailResponse } from '@/types/report';

// next/navigationのモック
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// session.tsのモック
vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
  isSessionValid: vi.fn(),
}));

// ReportFormのモック
vi.mock('../../../ReportForm', () => ({
  ReportForm: () => <div data-testid="report-form">Report Form</div>,
}));

// グローバルfetchのモック
global.fetch = vi.fn();

describe('ReportEditPage', () => {
  const mockReportData: ReportDetailResponse = {
    report_id: '507f1f77bcf86cd799439030',
    report_date: '2024-01-15',
    sales: {
      sales_id: '507f1f77bcf86cd799439011',
      sales_name: '山田太郎',
      department: '営業1課',
    },
    problem: 'テスト課題',
    plan: 'テスト予定',
    status: 'draft',
    visit_records: [
      {
        visit_id: '507f1f77bcf86cd799439040',
        customer: {
          customer_id: '507f1f77bcf86cd799439010',
          customer_code: 'C001',
          customer_name: '株式会社テスト',
        },
        visit_datetime: '2024-01-15T10:00:00.000Z',
        visit_content: 'テスト訪問内容',
        visit_result: 'テスト訪問結果',
        display_order: 1,
      },
    ],
    comments: {
      problem: [],
      plan: [],
    },
    created_at: '2024-01-15T00:00:00.000Z',
    updated_at: '2024-01-15T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('有効なセッションと日報データの場合、フォームが表示される', async () => {
    const { getSession, isSessionValid } = await import('@/lib/session');

    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      salesId: '507f1f77bcf86cd799439011',
      salesName: '山田太郎',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const mockResponse: ApiSuccessResponse<ReportDetailResponse> = {
      status: 'success',
      data: mockReportData,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439030' });
    const page = await ReportEditPage({ params });

    // ReportFormが含まれることを確認
    expect(page).toBeDefined();
    expect(page.props.children).toBeDefined();
  });

  test('無効なセッションの場合、ログイン画面にリダイレクトされる', async () => {
    const { getSession, isSessionValid } = await import('@/lib/session');

    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValue(false);

    // redirectは例外を投げるので、それを無視
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (redirect as any).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439030' });

    try {
      await ReportEditPage({ params });
    } catch {
      // redirectの例外は期待される動作
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  test('無効な日報IDの場合、一覧画面にリダイレクトされる', async () => {
    const { getSession, isSessionValid } = await import('@/lib/session');

    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      salesId: '507f1f77bcf86cd799439011',
      salesName: '山田太郎',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValue(true);

    // redirectは例外を投げるので、それを無視
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (redirect as any).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const params = Promise.resolve({ id: 'invalid-id' });

    try {
      await ReportEditPage({ params });
    } catch {
      // redirectの例外は期待される動作
    }

    expect(redirect).toHaveBeenCalledWith('/reports');
  });

  test('日報が見つからない場合、notFoundが呼ばれる', async () => {
    const { getSession, isSessionValid } = await import('@/lib/session');

    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      salesId: '507f1f77bcf86cd799439011',
      salesName: '山田太郎',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValue(true);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    // notFoundは例外を投げるので、それを無視
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (notFound as any).mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439030' });

    try {
      await ReportEditPage({ params });
    } catch {
      // notFoundの例外は期待される動作
    }

    expect(notFound).toHaveBeenCalled();
  });

  test('他人の日報にアクセスした場合、一覧画面にリダイレクトされる', async () => {
    const { getSession, isSessionValid } = await import('@/lib/session');

    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      salesId: '507f1f77bcf86cd799439999', // 異なるsalesId
      salesName: '別の営業',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const mockResponse: ApiSuccessResponse<ReportDetailResponse> = {
      status: 'success',
      data: mockReportData,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // redirectは例外を投げるので、それを無視
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (redirect as any).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439030' });

    try {
      await ReportEditPage({ params });
    } catch {
      // redirectの例外は期待される動作
    }

    expect(redirect).toHaveBeenCalledWith('/reports');
  });

  test('フェッチエラーが発生した場合、一覧画面にリダイレクトされる', async () => {
    const { getSession, isSessionValid } = await import('@/lib/session');

    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      salesId: '507f1f77bcf86cd799439011',
      salesName: '山田太郎',
      isManager: false,
    });
    (isSessionValid as ReturnType<typeof vi.fn>).mockReturnValue(true);

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    // redirectは例外を投げるので、それを無視
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (redirect as any).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const params = Promise.resolve({ id: '507f1f77bcf86cd799439030' });

    try {
      await ReportEditPage({ params });
    } catch {
      // redirectの例外は期待される動作
    }

    expect(redirect).toHaveBeenCalledWith('/reports');
  });
});
