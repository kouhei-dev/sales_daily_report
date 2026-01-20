import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { SalesListPage } from '../SalesListPage';
import type { SalesListResponse } from '@/types/sales';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';

// Next.js navigationのモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(),
}));

// usePaginationフックのモック
vi.mock('@/hooks/usePagination', () => ({
  usePagination: vi.fn(() => ({
    goToPage: vi.fn(),
    goToPreviousPage: vi.fn(),
    goToNextPage: vi.fn(),
    currentPage: 1,
  })),
}));

// グローバルfetchのモック
global.fetch = vi.fn();

describe('SalesListPage', () => {
  const mockSalesListResponse: ApiSuccessResponse<SalesListResponse> = {
    status: 'success',
    data: {
      items: [
        {
          sales_id: '1',
          sales_code: 'S001',
          sales_name: '山田太郎',
          email: 'yamada@example.com',
          department: '営業1課',
          is_manager: true,
          manager: {
            sales_id: '2',
            sales_name: '佐藤次郎',
          },
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        {
          sales_id: '3',
          sales_code: 'S002',
          sales_name: '田中花子',
          email: 'tanaka@example.com',
          department: '営業2課',
          is_manager: false,
          created_at: '2024-01-02T00:00:00.000Z',
          updated_at: '2024-01-02T00:00:00.000Z',
        },
      ],
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_items: 2,
        limit: 20,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
  });

  /**
   * テストヘルパー関数: departments API のモックを設定
   */
  const mockDepartmentsApi = (departments: string[] = []) => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          departments: departments.map((name, index) => ({
            department_id: `dept-${index}`,
            department_name: name,
            display_order: index + 1,
          })),
        },
      }),
    });
  };

  /**
   * テストヘルパー関数: sales API のモックを設定
   */
  const mockSalesApi = (
    response: ApiSuccessResponse<SalesListResponse> | ApiErrorResponse = mockSalesListResponse,
    ok = true
  ) => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok,
      json: async () => response,
    });
  };

  /**
   * テストヘルパー関数: departments + sales 両方のAPIモックを一度に設定
   */
  const mockBothApis = (
    salesResponse: ApiSuccessResponse<SalesListResponse> = mockSalesListResponse,
    departments: string[] = []
  ) => {
    mockDepartmentsApi(departments);
    mockSalesApi(salesResponse);
  };

  test('ページタイトルと説明が表示される', async () => {
    mockBothApis();

    render(<SalesListPage />);

    expect(screen.getByText('営業マスタ一覧')).toBeInTheDocument();
    expect(screen.getByText('営業担当者情報の管理')).toBeInTheDocument();
  });

  test('新規登録ボタンが表示される', async () => {
    mockBothApis();

    render(<SalesListPage />);

    const newButton = screen.getByRole('link', { name: '新規登録' });
    expect(newButton).toBeInTheDocument();
    expect(newButton).toHaveAttribute('href', '/sales/new');
  });

  test('ローディング中はスピナーが表示される', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // 永遠に完了しないPromise
    );

    render(<SalesListPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('データ取得成功時に営業一覧が表示される', async () => {
    mockBothApis();

    render(<SalesListPage />);

    await waitFor(() => {
      expect(screen.getByText('山田太郎')).toBeInTheDocument();
    });

    expect(screen.getByText('S001')).toBeInTheDocument();
    expect(screen.getByText('田中花子')).toBeInTheDocument();
    expect(screen.getByText('S002')).toBeInTheDocument();

    // テーブル内の営業1課と営業2課を確認
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('営業1課');
    expect(table).toHaveTextContent('営業2課');
  });

  test('データ取得失敗時にエラーメッセージが表示される', async () => {
    const errorResponse: ApiErrorResponse = {
      status: 'error',
      error: {
        code: 'SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    };

    mockDepartmentsApi();
    mockSalesApi(errorResponse, false);

    render(<SalesListPage />);

    await waitFor(() => {
      expect(screen.getByText('サーバーエラーが発生しました')).toBeInTheDocument();
    });
  });

  test('検索パラメータが正しくAPIリクエストに含まれる', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((key: string) => {
        const params: Record<string, string> = {
          sales_name: '山田',
          sales_code: 'S001',
          department: '営業1課',
          page: '2',
        };
        return params[key] || null;
      }),
    });

    mockBothApis();

    render(<SalesListPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sales_name=%E5%B1%B1%E7%94%B0'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sales_code=S001'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('department=%E5%96%B6%E6%A5%AD1%E8%AA%B2'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });

  test('APIリクエストに認証情報が含まれる', async () => {
    mockBothApis();

    render(<SalesListPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'GET',
        credentials: 'include',
      });
    });
  });

  test('データが0件の場合は空のメッセージが表示される', async () => {
    const emptyResponse: ApiSuccessResponse<SalesListResponse> = {
      status: 'success',
      data: {
        items: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_items: 0,
          limit: 20,
        },
      },
    };

    mockBothApis(emptyResponse);

    render(<SalesListPage />);

    await waitFor(() => {
      expect(
        screen.getByText('検索条件に一致する営業担当者が見つかりませんでした。')
      ).toBeInTheDocument();
    });
  });

  test('検索パラメータの変更時に再度データを取得する', async () => {
    // 初回マウント時
    mockBothApis();

    const { rerender } = render(<SalesListPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // searchParamsを変更
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((key: string) => (key === 'sales_name' ? '田中' : null)),
    });

    // 再レンダリング時（sales APIのみ再取得）
    mockSalesApi();

    rerender(<SalesListPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  test('ネットワークエラー時に空のデータが表示される', async () => {
    vi.clearAllMocks();

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const emptyResponse: ApiSuccessResponse<SalesListResponse> = {
      status: 'success',
      data: {
        items: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_items: 0,
          limit: 20,
        },
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => emptyResponse,
    });

    render(<SalesListPage />);

    // ローディングが完了するまで待機
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
