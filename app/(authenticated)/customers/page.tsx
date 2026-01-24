import { redirect } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import { CustomersListPage } from './CustomersListPage';

/**
 * 顧客マスタ一覧画面（S06）
 *
 * 全ユーザーがアクセス可能
 * 顧客情報の一覧を表示し、検索・フィルタリング・ページネーションが可能
 *
 * 機能:
 * - 顧客名・顧客コード・担当営業での検索
 * - 一覧表示（顧客コード、顧客名、業種、担当営業、電話番号、操作ボタン）
 * - ページネーション（20件/ページ）
 * - 新規登録ボタン
 * - 詳細・編集画面への遷移
 */
export default async function CustomersPage() {
  // セッション検証
  const session = await getSession();

  if (!isSessionValid(session)) {
    redirect('/login');
  }

  return <CustomersListPage />;
}
