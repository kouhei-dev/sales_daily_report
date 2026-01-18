'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { SalesSearchForm } from './SalesSearchForm';
import { SalesTable } from './SalesTable';
import { Pagination } from './Pagination';
import type { SalesListResponse } from '@/types/sales';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';

// 所属部署の定数（実際のデータから取得する場合は環境変数やAPIから取得）
const DEPARTMENTS = ['営業1課', '営業2課', '営業3課', '営業4課'];

/**
 * 営業マスタ一覧画面のメインコンポーネント
 *
 * 機能:
 * - 検索フォームの表示
 * - APIからデータ取得
 * - 一覧テーブルの表示
 * - ページネーション
 * - エラーハンドリング
 */
export function SalesListPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SalesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesList = async () => {
      try {
        setLoading(true);
        setError(null);

        // クエリパラメータの構築
        const params = new URLSearchParams();
        const salesName = searchParams.get('sales_name');
        const salesCode = searchParams.get('sales_code');
        const department = searchParams.get('department');
        const page = searchParams.get('page') || '1';

        if (salesName) params.set('sales_name', salesName);
        if (salesCode) params.set('sales_code', salesCode);
        if (department) params.set('department', department);
        params.set('page', page);
        params.set('limit', '20');

        const response = await fetch(`/api/sales?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json();
          throw new Error(errorData.error.message || 'データの取得に失敗しました');
        }

        const result: ApiSuccessResponse<SalesListResponse> = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Sales list fetch error:', err);
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesList();
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">営業マスタ一覧</h1>
          <p className="mt-1 text-sm text-gray-600">営業担当者情報の管理</p>
        </div>
        <Link href="/sales/new">
          <Button variant="primary">新規登録</Button>
        </Link>
      </div>

      {/* 検索フォーム */}
      <SalesSearchForm departments={DEPARTMENTS} />

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
          <SalesTable salesList={data.items} />

          {data.pagination.total_pages > 0 && (
            <Pagination
              currentPage={data.pagination.current_page}
              totalPages={data.pagination.total_pages}
              totalItems={data.pagination.total_items}
            />
          )}
        </>
      )}
    </div>
  );
}
