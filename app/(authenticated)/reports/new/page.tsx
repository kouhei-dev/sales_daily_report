import { redirect } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import { ReportForm } from '../ReportForm';

/**
 * 日報新規作成画面（S04-新規）
 *
 * 認証済みユーザーのみアクセス可能
 * 日報の新規作成を行う
 *
 * 機能:
 * - 日報日付、訪問記録（複数）、Problem、Planの入力
 * - 訪問記録の動的追加・削除（最大10件）
 * - 下書き保存と提出の処理分岐
 * - クライアントサイドバリデーション
 * - API連携（POST /api/reports）
 * - エラーハンドリング
 */
export default async function ReportNewPage() {
  // セッション検証
  const session = await getSession();

  if (!isSessionValid(session)) {
    redirect('/login');
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
          <li className="text-gray-900 font-medium">新規作成</li>
        </ol>
      </nav>

      {/* フォーム */}
      <ReportForm isEditMode={false} salesName={session.salesName} />
    </div>
  );
}
