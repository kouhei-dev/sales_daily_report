'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { SalesSearchForm } from './SalesSearchForm';
import { SalesTable } from './SalesTable';
import { Pagination } from '@/components/common/Pagination';
import type { SalesListResponse } from '@/types/sales';
import type { DepartmentListResponse } from '@/types/department';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { usePagination } from '@/hooks/usePagination';

/**
 * 営業マスタ一覧画面のメインコンポーネント
 *
 * 機能:
 * - 所属部署マスタAPIから部署一覧を取得
 * - 検索フォームの表示
 * - APIからデータ取得
 * - 一覧テーブルの表示
 * - ページネーション
 * - エラーハンドリング
 */
export function SalesListPage() {
  const searchParams = useSearchParams();
  const { goToPage } = usePagination({ basePath: '/sales' });
  const [data, setData] = useState<SalesListResponse | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 所属部署一覧を取得
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const result: ApiSuccessResponse<DepartmentListResponse> = await response.json();
          // department_name のみを配列に抽出
          const departmentNames = result.data.departments.map((dept) => dept.department_name);
          setDepartments(departmentNames);
        }
      } catch (err) {
        console.error('Departments fetch error:', err);
        // 部署取得に失敗してもエラー表示はせず、空配列のまま続行
      }
    };

    fetchDepartments();
  }, []);

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
        params.set('limit', String(DEFAULT_PAGE_SIZE));

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
      <SalesSearchForm departments={departments} />

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
              onPageChange={goToPage}
              pageSize={DEFAULT_PAGE_SIZE}
            />
          )}
        </>
      )}
    </div>
  );
}
