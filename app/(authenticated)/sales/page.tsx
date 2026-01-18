import { redirect } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import { SalesListPage } from './SalesListPage';

/**
 * 営業マスタ一覧画面（S08）
 *
 * 管理者のみアクセス可能
 * 営業担当者情報の一覧を表示し、検索・フィルタリング・ページネーションが可能
 *
 * 機能:
 * - 営業担当者名・営業コード・所属部署での検索
 * - 一覧表示（営業コード、営業担当者名、所属部署、上長、管理者フラグ、操作ボタン）
 * - ページネーション（20件/ページ）
 * - 新規登録ボタン
 * - 詳細・編集画面への遷移
 */
export default async function SalesPage() {
  // セッション検証
  const session = await getSession();

  if (!isSessionValid(session)) {
    redirect('/login');
  }

  // 管理者権限チェック
  if (!session.isManager) {
    redirect('/');
  }

  return <SalesListPage />;
}
