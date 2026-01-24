import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { ReportsListPage } from '../ReportsListPage';
import type { ReportListResponse } from '@/types/report';
import type { SalesListResponse } from '@/types/sales';

// Next.js navigationのモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(),
}));

// グローバルfetchのモック
global.fetch = vi.fn();

describe('ReportsListPage', () => {
  const mockSessionResponse = {
    status: 'success',
    data: {
      user: {
        sales_id: 's1',
        sales_code: 'S001',
        sales_name: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        is_manager: true,
      },
      session_expires_at: new Date(Date.now() + 1800000).toISOString(),
    },
  };

  const mockSalesResponse: SalesListResponse = {
    items: [
      {
        sales_id: 's1',
        sales_code: 'S001',
        sales_name: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        is_manager: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
      {
        sales_id: 's2',
        sales_code: 'S002',
        sales_name: '田中花子',
        email: 'tanaka@example.com',
        department: '営業2課',
        is_manager: false,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ],
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_items: 2,
      limit: 100,
    },
  };

  const mockReportsResponse: ReportListResponse = {
    items: [
      {
        report_id: 'r1',
        report_date: '2024-01-15',
        sales: {
          sales_id: 's1',
          sales_name: '山田太郎',
        },
        visit_count: 3,
        status: 'submitted',
        has_comments: true,
        unread_comment_count: 2,
        submitted_at: '2024-01-15T10:00:00.000Z',
        created_at: '2024-01-15T09:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
      },
      {
        report_id: 'r2',
        report_date: '2024-01-14',
        sales: {
          sales_id: 's2',
          sales_name: '田中花子',
        },
        visit_count: 5,
        status: 'commented',
        has_comments: true,
        unread_comment_count: 0,
        submitted_at: '2024-01-14T10:00:00.000Z',
        created_at: '2024-01-14T09:00:00.000Z',
        updated_at: '2024-01-14T11:00:00.000Z',
      },
    ],
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_items: 2,
      limit: 20,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse,
        } as Response);
      }
      if (url.includes('/api/sales')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockSalesResponse }),
        } as Response);
      }
      if (url.includes('/api/reports')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockReportsResponse }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  test('ページタイトルとヘッダーが表示される', async () => {
    render(<ReportsListPage />);

    await waitFor(() => {
      expect(screen.getByText('日報一覧')).toBeInTheDocument();
    });

    expect(screen.getByText('営業日報の管理')).toBeInTheDocument();
  });

  test('新規作成ボタンが表示される', async () => {
    render(<ReportsListPage />);

    await waitFor(() => {
      const newButton = screen.getByRole('link', { name: '新規作成' });
      expect(newButton).toBeInTheDocument();
      expect(newButton).toHaveAttribute('href', '/reports/new');
    });
  });

  test('日報一覧が表示される', async () => {
    render(<ReportsListPage />);

    await waitFor(() => {
      expect(screen.getAllByText('2024/01/15')[0]).toBeInTheDocument();
    });

    expect(screen.getAllByText('2024/01/14')[0]).toBeInTheDocument();
    expect(screen.getAllByText('山田太郎')[0]).toBeInTheDocument();
    expect(screen.getAllByText('田中花子')[0]).toBeInTheDocument();
  });

  test('検索フォームが表示される', async () => {
    render(<ReportsListPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('対象期間（開始）')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('対象期間（終了）')).toBeInTheDocument();
    expect(screen.getByLabelText('営業担当者')).toBeInTheDocument();
    expect(screen.getByLabelText('ステータス')).toBeInTheDocument();
  });

  test('セッション取得中はローディングが表示される', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      return new Promise(() => {}); // 永遠に解決しないPromise
    });

    render(<ReportsListPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('データ取得中はローディングが表示される', async () => {
    let resolveReports: (value: unknown) => void;
    const reportsPromise = new Promise((resolve) => {
      resolveReports = resolve;
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse,
        } as Response);
      }
      if (url.includes('/api/sales')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockSalesResponse }),
        } as Response);
      }
      if (url.includes('/api/reports')) {
        return reportsPromise as Promise<Response>;
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ReportsListPage />);

    // ローディング表示を待つ
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    // レポートデータを解決
    resolveReports!({
      ok: true,
      json: async () => ({ status: 'success', data: mockReportsResponse }),
    } as Response);

    // データが表示されるまで待つ
    await waitFor(() => {
      expect(screen.getAllByText('2024/01/15')[0]).toBeInTheDocument();
    });
  });

  test('APIエラー時にエラーメッセージが表示される', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse,
        } as Response);
      }
      if (url.includes('/api/sales')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockSalesResponse }),
        } as Response);
      }
      if (url.includes('/api/reports')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({
            status: 'error',
            error: {
              code: 'SERVER_ERROR',
              message: 'データの取得に失敗しました',
            },
          }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ReportsListPage />);

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  test('URLパラメータに基づいて検索が実行される', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((key: string) => {
        const params: Record<string, string> = {
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          sales_id: 's2',
          status: 'submitted',
        };
        return params[key] || null;
      }),
    });

    render(<ReportsListPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('start_date=2024-01-01'),
        expect.any(Object)
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('end_date=2024-01-31'),
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sales_id=s2'),
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('status=submitted'),
      expect.any(Object)
    );
  });

  test('ページネーションが表示される', async () => {
    const multiPageReportsResponse: ReportListResponse = {
      ...mockReportsResponse,
      pagination: {
        current_page: 1,
        total_pages: 3,
        total_items: 60,
        limit: 20,
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse,
        } as Response);
      }
      if (url.includes('/api/sales')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockSalesResponse }),
        } as Response);
      }
      if (url.includes('/api/reports')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: multiPageReportsResponse }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ReportsListPage />);

    await waitFor(() => {
      expect(screen.getByText('全 60 件中 1 - 20 件を表示')).toBeInTheDocument();
    });
  });

  test('データが0件の場合、空のメッセージが表示される', async () => {
    const emptyReportsResponse: ReportListResponse = {
      items: [],
      pagination: {
        current_page: 1,
        total_pages: 0,
        total_items: 0,
        limit: 20,
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSessionResponse,
        } as Response);
      }
      if (url.includes('/api/sales')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockSalesResponse }),
        } as Response);
      }
      if (url.includes('/api/reports')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: emptyReportsResponse }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ReportsListPage />);

    await waitFor(() => {
      expect(screen.getByText('該当する日報が見つかりませんでした。')).toBeInTheDocument();
    });
  });

  test('管理者の場合、検索フォームで全営業担当者が選択できる', async () => {
    render(<ReportsListPage />);

    await waitFor(() => {
      const select = screen.getByLabelText('営業担当者') as HTMLSelectElement;
      expect(select.disabled).toBe(false);
    });
  });

  test('営業担当者の場合、検索フォームが制限される', async () => {
    const nonManagerSessionResponse = {
      status: 'success',
      data: {
        user: {
          sales_id: 's2',
          sales_code: 'S002',
          sales_name: '田中花子',
          email: 'tanaka@example.com',
          department: '営業2課',
          is_manager: false,
        },
        session_expires_at: new Date(Date.now() + 1800000).toISOString(),
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => nonManagerSessionResponse,
        } as Response);
      }
      if (url.includes('/api/sales')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockSalesResponse }),
        } as Response);
      }
      if (url.includes('/api/reports')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockReportsResponse }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ReportsListPage />);

    await waitFor(() => {
      const select = screen.getByLabelText('営業担当者') as HTMLSelectElement;
      expect(select.disabled).toBe(true);
    });
  });
});
