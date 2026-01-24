import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { CustomersListPage } from '../CustomersListPage';
import type { CustomerListResponse } from '@/types/customer';
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

describe('CustomersListPage', () => {
  const mockCustomersListResponse: ApiSuccessResponse<CustomerListResponse> = {
    status: 'success',
    data: {
      items: [
        {
          customer_id: '1',
          customer_code: 'C001',
          customer_name: '株式会社テスト',
          industry: '製造業',
          address: '東京都千代田区',
          phone: '03-1234-5678',
          sales: {
            sales_id: 's1',
            sales_name: '山田太郎',
          },
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        {
          customer_id: '2',
          customer_code: 'C002',
          customer_name: '有限会社サンプル',
          industry: 'IT',
          address: '東京都渋谷区',
          phone: '03-9876-5432',
          sales: {
            sales_id: 's2',
            sales_name: '田中花子',
          },
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
   * テストヘルパー関数: sales API のモックを設定
   */
  const mockSalesApi = (salesNames: string[] = []) => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          items: salesNames.map((name, index) => ({
            sales_id: `s${index + 1}`,
            sales_code: `S00${index + 1}`,
            sales_name: name,
            email: `${name}@example.com`,
            department: '営業1課',
            is_manager: false,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          })),
          pagination: {
            current_page: 1,
            total_pages: 1,
            total_items: salesNames.length,
            limit: 20,
          },
        },
      }),
    });
  };

  /**
   * テストヘルパー関数: customers API のモックを設定
   */
  const mockCustomersApi = (
    response:
      | ApiSuccessResponse<CustomerListResponse>
      | ApiErrorResponse = mockCustomersListResponse,
    ok = true
  ) => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok,
      json: async () => response,
    });
  };

  /**
   * テストヘルパー関数: sales + customers 両方のAPIモックを一度に設定
   */
  const mockBothApis = (
    customersResponse: ApiSuccessResponse<CustomerListResponse> = mockCustomersListResponse,
    salesNames: string[] = []
  ) => {
    mockSalesApi(salesNames);
    mockCustomersApi(customersResponse);
  };

  test('ページタイトルと説明が表示される', async () => {
    mockBothApis();

    render(<CustomersListPage />);

    expect(screen.getByText('顧客マスタ一覧')).toBeInTheDocument();
    expect(screen.getByText('顧客情報の管理')).toBeInTheDocument();
  });

  test('新規登録ボタンが表示される', async () => {
    mockBothApis();

    render(<CustomersListPage />);

    const newButton = screen.getByRole('link', { name: '新規登録' });
    expect(newButton).toBeInTheDocument();
    expect(newButton).toHaveAttribute('href', '/customers/new');
  });

  test('ローディング中はスピナーが表示される', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // 永遠に完了しないPromise
    );

    render(<CustomersListPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('データ取得成功時に顧客一覧が表示される', async () => {
    mockBothApis();

    render(<CustomersListPage />);

    await waitFor(() => {
      expect(screen.getByText('株式会社テスト')).toBeInTheDocument();
    });

    expect(screen.getByText('C001')).toBeInTheDocument();
    expect(screen.getByText('有限会社サンプル')).toBeInTheDocument();
    expect(screen.getByText('C002')).toBeInTheDocument();

    // テーブル内の業種と担当営業を確認
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('製造業');
    expect(table).toHaveTextContent('IT');
    expect(table).toHaveTextContent('山田太郎');
    expect(table).toHaveTextContent('田中花子');
  });

  test('データ取得失敗時にエラーメッセージが表示される', async () => {
    const errorResponse: ApiErrorResponse = {
      status: 'error',
      error: {
        code: 'SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    };

    mockSalesApi();
    mockCustomersApi(errorResponse, false);

    render(<CustomersListPage />);

    await waitFor(() => {
      expect(screen.getByText('サーバーエラーが発生しました')).toBeInTheDocument();
    });
  });

  test('検索パラメータが正しくAPIリクエストに含まれる', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((key: string) => {
        const params: Record<string, string> = {
          customer_name: 'テスト',
          customer_code: 'C001',
          sales_name: '山田太郎',
          page: '2',
        };
        return params[key] || null;
      }),
    });

    mockBothApis();

    render(<CustomersListPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('customer_name=%E3%83%86%E3%82%B9%E3%83%88'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('customer_code=C001'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sales_name=%E5%B1%B1%E7%94%B0%E5%A4%AA%E9%83%8E'),
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

    render(<CustomersListPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'GET',
        credentials: 'include',
      });
    });
  });

  test('データが0件の場合は空のメッセージが表示される', async () => {
    const emptyResponse: ApiSuccessResponse<CustomerListResponse> = {
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

    render(<CustomersListPage />);

    await waitFor(() => {
      expect(
        screen.getByText('検索条件に一致する顧客が見つかりませんでした。')
      ).toBeInTheDocument();
    });
  });

  test('検索パラメータの変更時に再度データを取得する', async () => {
    // 初回マウント時
    mockBothApis();

    const { rerender } = render(<CustomersListPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // searchParamsを変更
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((key: string) => (key === 'customer_name' ? 'サンプル' : null)),
    });

    // 再レンダリング時（customers APIのみ再取得）
    mockCustomersApi();

    rerender(<CustomersListPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  test('電話番号と業種がない場合はハイフンが表示される', async () => {
    const responseWithOptionalFields: ApiSuccessResponse<CustomerListResponse> = {
      status: 'success',
      data: {
        items: [
          {
            customer_id: '1',
            customer_code: 'C001',
            customer_name: '株式会社テスト',
            sales: {
              sales_id: 's1',
              sales_name: '山田太郎',
            },
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          },
        ],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 1,
          limit: 20,
        },
      },
    };

    mockBothApis(responseWithOptionalFields);

    render(<CustomersListPage />);

    await waitFor(() => {
      expect(screen.getByText('株式会社テスト')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    // ハイフンが2つ表示される（業種と電話番号）
    const cells = table.querySelectorAll('td');
    const hyphenCells = Array.from(cells).filter((cell) => cell.textContent === '-');
    expect(hyphenCells.length).toBe(2);
  });

  test('営業担当者一覧の取得に失敗してもエラー表示せずに続行する', async () => {
    // sales APIでエラー
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
    // customers APIは成功
    mockCustomersApi();

    render(<CustomersListPage />);

    await waitFor(() => {
      expect(screen.getByText('株式会社テスト')).toBeInTheDocument();
    });

    // エラーメッセージが表示されないことを確認
    expect(screen.queryByText(/サーバーエラー/)).not.toBeInTheDocument();
  });
});
