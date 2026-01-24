import { redirect, notFound } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import { ReportForm } from '../../ReportForm';
import type { ReportDetailResponse } from '@/types/report';
import type { ApiSuccessResponse } from '@/types/session';

/**
 * 日報編集画面（S04-編集）
 *
 * 認証済みユーザーのみアクセス可能
 * 自分の日報のみ編集可能
 *
 * 機能:
 * - 既存データの取得と表示（日報日付は変更不可）
 * - 訪問記録（複数）、Problem、Planの編集
 * - 訪問記録の動的追加・削除（最大10件）
 * - 下書き保存と提出の処理分岐
 * - クライアントサイドバリデーション
 * - API連携（PUT /api/reports/:id）
 * - エラーハンドリング
 */
export default async function ReportEditPage({ params }: { params: Promise<{ id: string }> }) {
  // セッション検証
  const session = await getSession();

  if (!isSessionValid(session)) {
    redirect('/login');
  }

  const { id } = await params;

  // 日報IDのバリデーション（MongoDB ObjectId）
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    redirect('/reports');
  }

  // 日報データの取得
  let reportData: ReportDetailResponse;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/reports/${id}`, {
      headers: {
        Cookie: `session=${encodeURIComponent(JSON.stringify(session))}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      // その他のエラー（権限エラーなど）の場合は一覧にリダイレクト
      redirect('/reports');
    }

    const result: ApiSuccessResponse<ReportDetailResponse> = await response.json();
    reportData = result.data;
  } catch (error) {
    console.error('Failed to fetch report data:', error);
    redirect('/reports');
  }

  // 権限チェック: 自分の日報のみ編集可能
  if (reportData.sales.sales_id !== session.salesId) {
    redirect('/reports');
  }

  return (
    <div className="space-y-6">
      {/* パンくずリスト */}
      <nav className="text-sm text-gray-600">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/reports" className="hover:text-blue-600">
              日報一覧
            </a>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">{reportData.report_date}の日報編集</li>
        </ol>
      </nav>

      {/* フォーム */}
      <ReportForm reportData={reportData} isEditMode={true} salesName={session.salesName} />
    </div>
  );
}
