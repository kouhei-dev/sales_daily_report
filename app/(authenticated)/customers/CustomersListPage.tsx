'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { CustomersSearchForm } from './CustomersSearchForm';
import { CustomersTable } from './CustomersTable';
import { Pagination } from '@/components/common/Pagination';
import type { CustomerListResponse } from '@/types/customer';
import type { SalesListResponse } from '@/types/sales';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { usePagination } from '@/hooks/usePagination';

/**
 * 顧客マスタ一覧画面のメインコンポーネント
 *
 * 機能:
 * - 営業マスタAPIから担当営業一覧を取得
 *   - 営業担当者数の想定最大値: 100人（limit=100で全件取得）
 * - 検索フォームの表示
 * - APIからデータ取得
 * - 一覧テーブルの表示
 * - ページネーション
 * - エラーハンドリング
 */
export function CustomersListPage() {
  const searchParams = useSearchParams();
  const { goToPage } = usePagination({ basePath: '/customers' });
  const [data, setData] = useState<CustomerListResponse | null>(null);
  const [salesList, setSalesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 担当営業一覧を取得
  useEffect(() => {
    const fetchSalesList = async () => {
      try {
        const response = await fetch('/api/sales?limit=100', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const result: ApiSuccessResponse<SalesListResponse> = await response.json();
          // sales_name のみを配列に抽出
          const salesNames = result.data.items.map((sales) => sales.sales_name);
          setSalesList(salesNames);
        }
      } catch (err) {
        console.error('Sales list fetch error:', err);
        // 営業担当者取得に失敗してもエラー表示はせず、空配列のまま続行
      }
    };

    fetchSalesList();
  }, []);

  useEffect(() => {
    const fetchCustomersList = async () => {
      try {
        setLoading(true);
        setError(null);

        // クエリパラメータの構築
        const params = new URLSearchParams();
        const customerName = searchParams.get('customer_name');
        const customerCode = searchParams.get('customer_code');
        const salesName = searchParams.get('sales_name');
        const page = searchParams.get('page') || '1';

        if (customerName) params.set('customer_name', customerName);
        if (customerCode) params.set('customer_code', customerCode);
        if (salesName) params.set('sales_name', salesName);
        params.set('page', page);
        params.set('limit', String(DEFAULT_PAGE_SIZE));

        const response = await fetch(`/api/customers?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json();
          throw new Error(errorData.error.message || 'データの取得に失敗しました');
        }

        const result: ApiSuccessResponse<CustomerListResponse> = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Customers list fetch error:', err);
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomersList();
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">顧客マスタ一覧</h1>
          <p className="mt-1 text-sm text-gray-600">顧客情報の管理</p>
        </div>
        <Link href="/customers/new">
          <Button variant="primary">新規登録</Button>
        </Link>
      </div>

      {/* 検索フォーム */}
      <CustomersSearchForm salesList={salesList} />

      {/* エラー表示 */}
      {error && (
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ローディング表示 */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* 一覧テーブルとページネーション */}
      {!loading && data && (
        <>
          <CustomersTable customersList={data.items} />

          {data.pagination.total_pages > 0 && (
            <Pagination
              currentPage={data.pagination.current_page}
              totalPages={data.pagination.total_pages}
              totalItems={data.pagination.total_items}
              onPageChange={goToPage}
              pageSize={DEFAULT_PAGE_SIZE}
            />
          )}
        </>
      )}
    </div>
  );
}
