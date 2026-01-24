'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { ReportsSearchForm } from './ReportsSearchForm';
import { ReportsTable } from './ReportsTable';
import { Pagination } from '@/components/common/Pagination';
import type { ReportListResponse } from '@/types/report';
import type { SalesListResponse } from '@/types/sales';
import type { SessionData } from '@/types/session';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/session';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { usePagination } from '@/hooks/usePagination';

/**
 * 日報一覧画面のメインコンポーネント
 *
 * 機能:
 * - セッション情報の取得（権限確認用）
 * - 営業マスタAPIから営業担当者一覧を取得
 * - 検索フォームの表示
 * - APIからデータ取得
 * - 一覧テーブルの表示
 * - ページネーション
 * - エラーハンドリング
 */
export function ReportsListPage() {
  const searchParams = useSearchParams();
  const { goToPage } = usePagination({ basePath: '/reports' });
  const [data, setData] = useState<ReportListResponse | null>(null);
  const [salesList, setSalesList] = useState<Array<{ sales_id: string; sales_name: string }>>([]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // セッション情報を取得
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && result.data.user) {
            // セッションデータの形式に変換
            const user = result.data.user;
            const sessionData: SessionData = {
              salesId: user.sales_id,
              salesCode: user.sales_code,
              salesName: user.sales_name,
              email: user.email,
              department: user.department,
              isManager: user.is_manager,
              expiresAt: new Date(result.data.session_expires_at).getTime(),
            };
            setSession(sessionData);
          }
        }
      } catch (err) {
        console.error('Session fetch error:', err);
        // セッション取得に失敗してもエラー表示はせず、続行
      }
    };

    fetchSession();
  }, []);

  // 営業担当者一覧を取得
  useEffect(() => {
    const fetchSalesList = async () => {
      try {
        const response = await fetch('/api/sales?limit=100', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const result: ApiSuccessResponse<SalesListResponse> = await response.json();
          // sales_id と sales_name のみを配列に抽出
          const salesData = result.data.items.map((sales) => ({
            sales_id: sales.sales_id,
            sales_name: sales.sales_name,
          }));
          setSalesList(salesData);
        }
      } catch (err) {
        console.error('Sales list fetch error:', err);
        // 営業担当者取得に失敗してもエラー表示はせず、空配列のまま続行
      }
    };

    fetchSalesList();
  }, []);

  // 日報一覧を取得
  useEffect(() => {
    const fetchReportsList = async () => {
      try {
        setLoading(true);
        setError(null);

        // クエリパラメータの構築
        const params = new URLSearchParams();
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const salesId = searchParams.get('sales_id');
        const status = searchParams.get('status');
        const hasUnreadComments = searchParams.get('has_unread_comments');
        const page = searchParams.get('page') || '1';

        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
        if (salesId) params.set('sales_id', salesId);
        if (status) params.set('status', status);
        if (hasUnreadComments) params.set('has_unread_comments', hasUnreadComments);
        params.set('page', page);
        params.set('limit', String(DEFAULT_PAGE_SIZE));

        const response = await fetch(`/api/reports?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json();
          throw new Error(errorData.error.message || 'データの取得に失敗しました');
        }

        const result: ApiSuccessResponse<ReportListResponse> = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Reports list fetch error:', err);
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchReportsList();
  }, [searchParams]);

  // セッション情報が読み込まれるまでローディングを表示
  if (!session) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">日報一覧</h1>
          <p className="mt-1 text-sm text-gray-600">営業日報の管理</p>
        </div>
        <Link href="/reports/new">
          <Button variant="primary">新規作成</Button>
        </Link>
      </div>

      {/* 検索フォーム */}
      <ReportsSearchForm
        salesList={salesList}
        currentUserSalesId={session.salesId}
        isManager={session.isManager}
      />

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
          <ReportsTable reportsList={data.items} currentUserSalesId={session.salesId} />

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
