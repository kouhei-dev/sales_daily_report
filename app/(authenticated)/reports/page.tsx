import { redirect } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import { ReportsListPage } from './ReportsListPage';

/**
 * 日報一覧画面（S03）
 *
 * 全ユーザーがアクセス可能
 * 日報の一覧を表示し、検索・フィルタリング・ページネーションが可能
 *
 * 機能:
 * - 対象期間（開始/終了）での検索
 * - 営業担当者での絞り込み（管理者は全員、営業は自分のみ）
 * - ステータス（全て/下書き/提出済み/コメント済み）での絞り込み
 * - 未確認コメントフィルタ
 * - 一覧表示（日報日付、営業担当者、訪問件数、ステータス、コメント、未確認バッジ、操作ボタン）
 * - ページネーション（20件/ページ）
 * - 詳細・編集画面への遷移
 */
export default async function ReportsPage() {
  // セッション検証
  const session = await getSession();

  if (!isSessionValid(session)) {
    redirect('/login');
  }

  return <ReportsListPage />;
}
