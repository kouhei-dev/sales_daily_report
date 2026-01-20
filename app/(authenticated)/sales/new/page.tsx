import { redirect } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import { SalesForm } from '../SalesForm';

/**
 * 営業マスタ新規登録画面（S09-新規）
 *
 * 管理者のみアクセス可能
 * 営業担当者情報の新規登録を行う
 *
 * 機能:
 * - 営業コード、営業担当者名、メールアドレス、パスワード、所属部署、上長、管理者権限の入力
 * - クライアントサイドバリデーション
 * - API連携（POST /api/sales）
 * - エラーハンドリング
 */
export default async function SalesNewPage() {
  // セッション検証
  const session = await getSession();

  if (!isSessionValid(session)) {
    redirect('/login');
  }

  // 管理者権限チェック
  if (!session.isManager) {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      {/* パンくずリスト */}
      <nav className="text-sm text-gray-600">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/sales" className="hover:text-blue-600">
              営業マスタ一覧
            </a>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">新規登録</li>
        </ol>
      </nav>

      {/* フォーム */}
      <SalesForm isEditMode={false} />
    </div>
  );
}
