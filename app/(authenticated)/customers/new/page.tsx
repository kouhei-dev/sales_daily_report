import { redirect } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import { CustomerForm } from '../CustomerForm';

/**
 * 顧客マスタ新規登録画面（S07-新規）
 *
 * 営業担当者・管理者がアクセス可能
 * 顧客情報の新規登録を行う
 *
 * 機能:
 * - 顧客コード、顧客名、業種、郵便番号、住所、電話番号、担当営業、備考の入力
 * - クライアントサイドバリデーション
 * - API連携（POST /api/customers）
 * - エラーハンドリング
 */
export default async function CustomerNewPage() {
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
            <a href="/customers" className="hover:text-blue-600">
              顧客マスタ一覧
            </a>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">新規登録</li>
        </ol>
      </nav>

      {/* フォーム */}
      <CustomerForm isEditMode={false} />
    </div>
  );
}
