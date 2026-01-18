import { redirect } from 'next/navigation';
import { getSession, isSessionValid } from '@/lib/session';
import { AuthenticatedLayoutClient } from '@/components/layout/AuthenticatedLayoutClient';

/**
 * Authenticated Layout (Server Component)
 *
 * 認証済みユーザー向けの共通レイアウト
 *
 * 機能:
 * - セッション検証（無効な場合はログイン画面へリダイレクト）
 * - セッションデータの取得とClient Componentへの受け渡し
 */
export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  // セッション検証
  const session = await getSession();

  if (!isSessionValid(session)) {
    redirect('/login');
  }

  // セッションデータをClient Componentに渡す
  return (
    <AuthenticatedLayoutClient userName={session.salesName!} isManager={session.isManager!}>
      {children}
    </AuthenticatedLayoutClient>
  );
}
